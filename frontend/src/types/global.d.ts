// Global types for drag & drop
declare global {
  interface Window {
    __draggedNodeId?: string
    __draggedNodeParentId?: string
    __draggedNodeIndex?: number
  }
}

export {}
