<template>
  <div class="board-view">
    <BoardFilters
      v-model:search="searchQuery"
      v-model:assignee="assigneeFilter"
      v-model:type="typeFilter"
      :assignees="projectMembers"
    />

    <div class="board-view__content">
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Node, NodeStatus } from '@/api/nodes'
import type { ProjectMember } from '@/api/projects'
import { useNodesStore } from '@/stores/nodes'
import BoardColumn from './BoardColumn.vue'
import BoardFilters from './BoardFilters.vue'

const props = defineProps<{
  allNodes: Node[]
  selectedNodeId?: string | null
  projectMembers: ProjectMember[]
}>()

const emit = defineEmits<{
  (e: 'select-node', id: string): void
}>()

const nodesStore = useNodesStore()

// Filters
const searchQuery = ref('')
const assigneeFilter = ref('')
const typeFilter = ref('')

// Local state for columns
const todoNodes = ref<Node[]>([])
const inProgressNodes = ref<Node[]>([])
const doneNodes = ref<Node[]>([])

// Distribute nodes into columns
const distributeNodes = () => {
  // Filter out ROOT node and safely handle null/undefined
  let nodes = (props.allNodes || []).filter(n => n.type !== 'ROOT')

  // Apply filters
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    nodes = nodes.filter(n => n.title.toLowerCase().includes(query))
  }

  if (assigneeFilter.value) {
    nodes = nodes.filter(n => n.assignees.some(a => a.user.id === assigneeFilter.value))
  }

  if (typeFilter.value) {
    nodes = nodes.filter(n => n.type === typeFilter.value)
  }

  // Sort by updated_at (newest first) to have some consistent order
  const sorter = (a: Node, b: Node) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()

  todoNodes.value = nodes.filter(n => n.status === 'TODO').sort(sorter)
  inProgressNodes.value = nodes.filter(n => n.status === 'IN_PROGRESS').sort(sorter)
  doneNodes.value = nodes.filter(n => n.status === 'DONE').sort(sorter)
}

// Watch for changes in props (store updates) or filters
watch(
  [() => props.allNodes, searchQuery, assigneeFilter, typeFilter],
  distributeNodes,
  { deep: true, immediate: true }
)

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
  display: flex;
  flex-direction: column;
  background-color: #f1f5f9;
  overflow: hidden;
}

.board-view__content {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 24px;
}

.board-view__columns {
  display: flex;
  gap: 24px;
  height: 100%;
  align-items: flex-start;
}
</style>
