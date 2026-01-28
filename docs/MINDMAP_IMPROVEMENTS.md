# GameGuru MindMap - Analysis & Improvement Recommendations

## Problem Summary (from Polish feedback)
The user reported several issues with the MindMap functionality:

1. **No state persistence** - Zoom, pan position, and collapsed/expanded nodes are not saved per user
2. **Reloading issues** - UI reloads when rearranging items
3. **Drag & drop not smooth** - Reparenting through drag & drop is not smooth
4. **Missing board view** - No alternative Kanban/board view

## Completed Improvements (Phase 1)

### ✅ User View State Persistence
- **Database Schema**: Added `UserViewState` model to store per-user, per-project view preferences
- **Backend API**: Created REST endpoints for saving/loading view state
  - `GET /view-state/:projectId` - Load saved state
  - `POST /view-state` - Save/update state
  - `DELETE /view-state/:projectId` - Reset state
- **Frontend Store**: Enhanced nodes store with:
  - Automatic state restoration on project load
  - Debounced auto-save (1 second) for zoom, pan, and expanded nodes
  - Optimistic updates for smoother UX
- **MindMap Integration**: Modified MindMapFlow component to:
  - Track viewport changes via `@viewport-change` event
  - Restore saved viewport on mount
  - Save state on pan, zoom, and node expand/collapse

## Recommended Next Steps

### Phase 2: Enhance Drag & Drop UX

#### 2.1 Visual Feedback Improvements
- **Drop Zone Highlighting**: Add visual indicators when hovering over potential drop targets
  ```typescript
  // Add to MindMapNode.vue
  const isDropTarget = ref(false)
  // Highlight node with border/glow when valid drop target
  ```

- **Drag Ghost/Preview**: Show a semi-transparent preview of the node being dragged
  ```css
  .mindmap-node--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }
  ```

- **Connection Line Preview**: Show temporary connection line during drag to indicate new parent relationship

#### 2.2 Improve Drop Detection
- **Larger Drop Zones**: Increase the threshold distance for drop detection
  ```typescript
  const THRESHOLD = 150 // Increase from current 100
  ```

- **Smart Drop Zones**: Add dedicated drop zones between nodes for better ordering control

#### 2.3 Performance Optimization
- **Reduce Layout Recalculation**: Current implementation recalculates entire tree layout on each change
  - Cache layout calculations
  - Only recalculate affected subtrees
  
- **Debounce API Calls**: Already implemented for view state, ensure it's applied to move operations

### Phase 3: Board/Kanban View Alternative

#### 3.1 Component Structure
```
components/
  board/
    BoardView.vue          # Main Kanban board
    BoardColumn.vue        # Status column (TODO, IN_PROGRESS, DONE)
    BoardCard.vue          # Task card
    BoardFilters.vue       # Filter by assignee, type, etc.
```

#### 3.2 Features
- **Status-based Columns**: Group nodes by status (TODO, IN_PROGRESS, DONE)
- **Drag & Drop**: Move cards between columns to change status
- **Swimlanes**: Optional grouping by assignee or milestone
- **Quick Actions**: Inline editing, quick status change, add sub-tasks
- **View Toggle**: Button to switch between MindMap and Board views

#### 3.3 State Management
```typescript
// Add to nodes store
const viewMode = ref<'mindmap' | 'board'>('mindmap')

const setViewMode = (mode: 'mindmap' | 'board') => {
  viewMode.value = mode
  setViewType(mode)
}
```

### Phase 4: Performance & UX Enhancements

#### 4.1 Keyboard Shortcuts
- `Space + Drag` - Pan canvas
- `+/-` - Zoom in/out
- `F` - Fit view
- `0` - Reset zoom to 100%
- `E` - Expand all nodes
- `C` - Collapse all nodes
- `N` - New node
- `Delete` - Delete selected node (already implemented)
- `Escape` - Deselect (already implemented)
- `Ctrl+Z` - Undo (to implement)
- `Ctrl+Y` - Redo (to implement)

#### 4.2 Search & Filter
```typescript
interface NodeFilter {
  search: string
  status: NodeStatus[]
  type: NodeType[]
  assignees: string[]
}

// Add search bar in ProjectBoardView
// Filter nodes tree based on criteria
// Highlight matching nodes
```

#### 4.3 Undo/Redo System
```typescript
// Command pattern for undo/redo
interface Command {
  execute(): Promise<void>
  undo(): Promise<void>
}

class MoveNodeCommand implements Command {
  // Store previous state
  // Execute move
  // Implement undo
}

// History stack
const undoStack: Command[] = []
const redoStack: Command[] = []
```

#### 4.4 Virtual Scrolling
For large mind maps (100+ nodes), implement virtual scrolling:
- Only render visible nodes
- Load adjacent nodes on demand
- Improve performance significantly

### Phase 5: Advanced Features

#### 5.1 Node Templates
```typescript
interface NodeTemplate {
  id: string
  name: string
  structure: {
    title: string
    type: NodeType
    children: NodeTemplate['structure'][]
  }
}

// Predefined templates:
// - Sprint Planning (Epic -> Stories -> Tasks)
// - Feature Development (Feature -> Components -> Tasks)
// - Bug Tracking (Bug -> Investigation -> Fix -> Test)
```

#### 5.2 Batch Operations
- Multi-select nodes (Ctrl+Click or drag-select box)
- Bulk status change
- Bulk delete
- Bulk move to different parent
- Bulk assign

#### 5.3 Export Functionality
- **PNG Export**: Render entire mind map or visible area to image
- **PDF Export**: Multi-page document with mind map
- **JSON Export**: Data export for backup or migration
- **Markdown Export**: Hierarchical text representation

#### 5.4 Real-time Collaboration
- **WebSocket Integration**: Push updates to all connected users
- **Presence Indicators**: Show who's viewing/editing
- **Conflict Resolution**: Handle concurrent edits
- **Activity Feed**: Show recent changes by team members

#### 5.5 Auto-save Indicator
Add visual feedback for save operations:
```vue
<div class="save-status">
  <span v-if="saving">Saving...</span>
  <span v-else-if="saved">✓ Saved</span>
  <span v-else-if="error">⚠ Error saving</span>
</div>
```

## Technical Debt & Code Quality

### 1. Type Safety
- Add stricter TypeScript types throughout
- Avoid `any` types in critical paths
- Use branded types for IDs

### 2. Error Handling
- Implement proper error boundaries
- Add retry logic for failed API calls
- Show user-friendly error messages
- Log errors to monitoring service

### 3. Testing
- Add unit tests for stores
- Add component tests for critical components
- Add E2E tests for key workflows
- Aim for >80% code coverage

### 4. Accessibility
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works everywhere
- Add screen reader support
- Test with accessibility tools

### 5. Mobile Responsiveness
- Current implementation is desktop-focused
- Add touch gesture support for pan/zoom
- Optimize layout for mobile screens
- Consider separate mobile UI

## Performance Metrics to Track

1. **Initial Load Time**: Time to first render
2. **Drag Response Time**: Latency during drag operations
3. **Save Time**: Time to persist view state
4. **Tree Rendering Time**: Time to render large trees
5. **Memory Usage**: Monitor for memory leaks

## Implementation Priority

### High Priority (Immediate)
1. ✅ View state persistence (DONE)
2. Enhanced drag & drop visual feedback
3. Board view implementation
4. Search & filter functionality

### Medium Priority (Next Sprint)
1. Keyboard shortcuts
2. Undo/redo system
3. Performance optimization (virtual scrolling)
4. Node templates

### Low Priority (Future)
1. Batch operations
2. Export functionality
3. Real-time collaboration
4. Advanced analytics

## Conclusion

The current implementation provides a solid foundation. The completed Phase 1 (view state persistence) addresses the core issue of losing user preferences. The recommended improvements in Phases 2-5 will significantly enhance the user experience and make GameGuru a more powerful project management tool.

Key focus areas:
1. **Smooth interactions** - Better drag & drop, visual feedback
2. **Flexibility** - Multiple view modes (mindmap, board)
3. **Efficiency** - Keyboard shortcuts, search, batch operations
4. **Scale** - Performance optimization for large projects
5. **Collaboration** - Real-time updates, presence indicators
