<script setup lang="ts">
import { computed } from 'vue'
import { useStoryStore } from '@/stores/story'
import StoryElementCard from './StoryElementCard.vue'
import type { TreeStoryElement } from '@/stores/story'
import type { StoryElement, StoryElementType } from '@/api/story'

const storyStore = useStoryStore()

const storyTree = computed(() => storyStore.storyTree)
const selectedElementId = computed(() => storyStore.selectedElementId)

const emit = defineEmits<{
  'create-element': [parentId: string | null, type: StoryElementType]
}>()

function handleSelect(element: StoryElement) {
  storyStore.selectElement(element.id)
}

function handleToggle(elementId: string) {
  storyStore.toggleExpand(elementId)
}

function handleCreateElement(parentId: string | null, type: StoryElementType) {
  emit('create-element', parentId, type)
}

function renderTree(elements: TreeStoryElement[], depth = 0) {
  return elements
}
</script>

<template>
  <div class="story-tree">
    <div class="story-tree__header">
      <h3 class="story-tree__title">Hierarchia fabuły</h3>
      <div class="story-tree__actions">
        <button
          class="btn-icon"
          title="Rozwiń wszystko"
          @click="storyStore.expandAll()"
        >
          ⊞
        </button>
        <button
          class="btn-icon"
          title="Zwiń wszystko"
          @click="storyStore.collapseAll()"
        >
          ⊟
        </button>
        <button
          class="btn-icon btn-icon--primary"
          title="Dodaj element główny"
          @click="handleCreateElement(null, 'OVERVIEW')"
        >
          +
        </button>
      </div>
    </div>

    <div class="story-tree__content">
      <template v-if="storyTree.length === 0">
        <div class="empty-state">
          <span class="empty-icon">📖</span>
          <p>Brak elementów fabuły</p>
          <button
            class="btn btn--primary btn--sm"
            @click="handleCreateElement(null, 'OVERVIEW')"
          >
            Dodaj pierwszy element
          </button>
        </div>
      </template>

      <template v-else>
        <div
          v-for="element in storyTree"
          :key="element.id"
          class="tree-node"
        >
          <TreeNode
            :element="element"
            :depth="0"
            :selected-id="selectedElementId"
            @select="handleSelect"
            @toggle="handleToggle"
            @create="handleCreateElement"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
// Rekurencyjny komponent dla renderowania drzewa
import { defineComponent, type PropType } from 'vue'
import type { TreeStoryElement } from '@/stores/story'

const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    element: {
      type: Object as PropType<TreeStoryElement>,
      required: true,
    },
    depth: {
      type: Number,
      default: 0,
    },
    selectedId: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
  emits: ['select', 'toggle', 'create'],
  setup(props, { emit }) {
    const hasChildren = computed(() => props.element.children && props.element.children.length > 0)
    const isSelected = computed(() => props.element.id === props.selectedId)

    return {
      hasChildren,
      isSelected,
    }
  },
  template: `
    <div class="tree-node__wrapper">
      <div class="tree-node__row">
        <button
          v-if="hasChildren"
          class="tree-node__toggle"
          @click.stop="$emit('toggle', element.id)"
        >
          {{ element.isExpanded ? '▼' : '▶' }}
        </button>
        <div v-else class="tree-node__toggle tree-node__toggle--empty"></div>
        
        <StoryElementCard
          :element="element"
          :is-selected="isSelected"
          :depth="depth"
          @select="$emit('select', $event)"
        />
        
        <button
          class="tree-node__add"
          title="Dodaj element potomny"
          @click.stop="$emit('create', element.id, 'SCENE')"
        >
          +
        </button>
      </div>
      
      <div v-if="hasChildren && element.isExpanded" class="tree-node__children">
        <TreeNode
          v-for="child in element.children"
          :key="child.id"
          :element="child"
          :depth="depth + 1"
          :selected-id="selectedId"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
          @create="$emit('create', $event, $event)"
        />
      </div>
    </div>
  `,
})

export { TreeNode }
</script>

<style scoped>
.story-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

.story-tree__header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.story-tree__title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.story-tree__actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-icon--primary {
  background: #7c3aed;
  border-color: #7c3aed;
  color: white;
}

.btn-icon--primary:hover {
  background: #6d28d9;
}

.story-tree__content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 14px;
}

.tree-node__wrapper {
  margin-bottom: 2px;
}

.tree-node__row {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.tree-node__toggle {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  color: #64748b;
  font-size: 10px;
  flex-shrink: 0;
  transition: color 0.2s;
}

.tree-node__toggle:hover {
  color: #1e293b;
}

.tree-node__toggle--empty {
  cursor: default;
}

.tree-node__add {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  color: #7c3aed;
  font-size: 16px;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tree-node__row:hover .tree-node__add {
  opacity: 1;
}

.tree-node__add:hover {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
}

.tree-node__children {
  margin-left: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn--primary {
  background: #7c3aed;
  color: white;
}

.btn--primary:hover {
  background: #6d28d9;
}

.btn--sm {
  padding: 6px 12px;
  font-size: 12px;
}
</style>
