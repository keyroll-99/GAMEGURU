<template>
  <div class="board-view">
    <div class="board-view__columns">
      <BoardColumn
        title="Do zrobienia"
        status="TODO"
        v-model="todoNodes"
        :selected-node-id="selectedNodeId"
        @change="handleColumnChange($event, 'TODO')"
        @node-click="$emit('select-node', $event.id)"
      />

      <BoardColumn
        title="W trakcie"
        status="IN_PROGRESS"
        v-model="inProgressNodes"
        :selected-node-id="selectedNodeId"
        @change="handleColumnChange($event, 'IN_PROGRESS')"
        @node-click="$emit('select-node', $event.id)"
      />

      <BoardColumn
        title="Gotowe"
        status="DONE"
        v-model="doneNodes"
        :selected-node-id="selectedNodeId"
        @change="handleColumnChange($event, 'DONE')"
        @node-click="$emit('select-node', $event.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Node, NodeStatus } from '@/api/nodes'
import { useNodesStore } from '@/stores/nodes'
import BoardColumn from './BoardColumn.vue'

const props = defineProps<{
  allNodes: Node[]
  selectedNodeId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select-node', id: string): void
}>()

const nodesStore = useNodesStore()

// Local state for columns
const todoNodes = ref<Node[]>([])
const inProgressNodes = ref<Node[]>([])
const doneNodes = ref<Node[]>([])

// Distribute nodes into columns
const distributeNodes = () => {
  // Filter out ROOT node and safely handle null/undefined
  const nodes = (props.allNodes || []).filter(n => n.type !== 'ROOT')

  // Sort by updated_at (newest first) to have some consistent order
  const sorter = (a: Node, b: Node) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()

  todoNodes.value = nodes.filter(n => n.status === 'TODO').sort(sorter)
  inProgressNodes.value = nodes.filter(n => n.status === 'IN_PROGRESS').sort(sorter)
  doneNodes.value = nodes.filter(n => n.status === 'DONE').sort(sorter)
}

// Watch for changes in props (store updates)
watch(() => props.allNodes, distributeNodes, { deep: true, immediate: true })

const handleColumnChange = async (event: any, status: NodeStatus) => {
  // We only care about 'added' event which means a node was dropped into this column
  if (event.added) {
    const node = event.added.element as Node
    // Update status in store/backend
    try {
        await nodesStore.updateNode(node.id, { status })
    } catch (e) {
        console.error('Failed to update node status', e)
        // If failed, distributeNodes will eventually revert changes if store rolls back
    }
  }
}
</script>

<style scoped>
.board-view {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 24px;
  background-color: #f1f5f9;
}

.board-view__columns {
  display: flex;
  gap: 24px;
  height: 100%;
  align-items: flex-start;
}
</style>
