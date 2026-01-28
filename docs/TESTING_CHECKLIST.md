# Testing Checklist for MindMap Drag & Drop Improvements

## Pre-Testing Setup
1. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```
2. Access the application at http://localhost:5173
3. Create or open a project with a MindMap
4. Ensure there are multiple nodes (at least 5-10 for comprehensive testing)

## Test Scenarios

### 1. Basic Drag & Drop Functionality
- [ ] **Test 1.1:** Drag a TASK node to a different parent
  - **Steps:**
    1. Click and hold on a TASK node
    2. Drag it over a MILESTONE node
    3. Release the mouse
  - **Expected:** Node should move to the new parent
  - **Visual Check:** Green border/glow while hovering over valid target

- [ ] **Test 1.2:** Drag a TASK to another TASK
  - **Steps:**
    1. Drag a TASK node over another TASK node
    2. Observe the visual feedback
  - **Expected:** 
    - Green feedback if different parent
    - Successfully moves as a sibling or child

### 2. Visual Feedback Tests
- [ ] **Test 2.1:** Dragging state
  - **Steps:** Start dragging any node (not ROOT)
  - **Expected:** 
    - Node becomes semi-transparent (50% opacity)
    - Cursor changes to "grabbing"
    - Node has elevated shadow

- [ ] **Test 2.2:** Valid drop target
  - **Steps:** Drag node over a valid drop target
  - **Expected:**
    - Target node scales up slightly (~105%)
    - Green border (3px) appears
    - Green glow/shadow around target
    - Light green background tint

- [ ] **Test 2.3:** Invalid drop target - Same parent
  - **Steps:** 
    1. Note the current parent of a node
    2. Drag the node over its current parent
  - **Expected:**
    - Red border appears
    - Red glow/shadow
    - Light red background tint

- [ ] **Test 2.4:** Invalid drop target - Descendant
  - **Steps:**
    1. Find a node with children
    2. Try to drag it onto one of its children or grandchildren
  - **Expected:**
    - Red border/glow (invalid indicator)
    - Node snaps back to original position on drop

### 3. Validation Tests
- [ ] **Test 3.1:** Cannot drag ROOT node
  - **Steps:** Try to drag the ROOT node
  - **Expected:** ROOT node cannot be dragged at all

- [ ] **Test 3.2:** Prevent circular references
  - **Steps:**
    1. Create structure: A → B → C
    2. Try to drag A onto C
  - **Expected:**
    - Red feedback during drag
    - Drop is rejected, A stays in place

- [ ] **Test 3.3:** Cannot drop on self
  - **Steps:** Try to drag a node onto itself
  - **Expected:**
    - Red feedback or no feedback
    - Drop is rejected

### 4. Drop Zone Size Tests
- [ ] **Test 4.1:** 150px drop threshold
  - **Steps:**
    1. Drag a node near (but not directly over) a target
    2. Get within approximately 150px of the target center
  - **Expected:** 
    - Target should highlight when within ~150px
    - Easier to target than before (was 100px)

### 5. Interaction with Other Features
- [ ] **Test 5.1:** Zoom still works
  - **Steps:**
    1. Use mouse wheel to zoom in/out
    2. Use the zoom controls
  - **Expected:** Zoom works normally, independent of drag improvements

- [ ] **Test 5.2:** Pan still works
  - **Steps:** Click and drag on empty canvas area
  - **Expected:** Canvas pans/moves, not affected by node drag

- [ ] **Test 5.3:** Expand/Collapse still works
  - **Steps:** Click the +/- buttons on nodes with children
  - **Expected:** Children expand/collapse normally

- [ ] **Test 5.4:** Node selection works
  - **Steps:** Click on nodes to select them
  - **Expected:** Selection works, sidebar shows node details

- [ ] **Test 5.5:** Reorder children panel works
  - **Steps:**
    1. Select a node with children
    2. Click "Sortuj zadania" button
    3. Reorder using the panel
  - **Expected:** Reordering works independently of main drag & drop

### 6. Performance Tests
- [ ] **Test 6.1:** Smooth dragging with 10+ nodes
  - **Steps:**
    1. Create or open a project with 10+ nodes
    2. Drag nodes around
  - **Expected:**
    - Smooth animations (60fps)
    - No lag or stuttering
    - Visual feedback updates in real-time

- [ ] **Test 6.2:** Large tree (50+ nodes)
  - **Steps:**
    1. Create or open a large project (50+ nodes)
    2. Test drag & drop
  - **Expected:**
    - Still performs well
    - No significant performance degradation
    - Visual feedback still smooth

### 7. Edge Cases
- [ ] **Test 7.1:** Drag and release outside map area
  - **Steps:** 
    1. Start dragging a node
    2. Move cursor outside the viewport
    3. Release
  - **Expected:** Node snaps back to original position

- [ ] **Test 7.2:** Drag during zoom
  - **Steps:**
    1. Start dragging a node
    2. Use mouse wheel to zoom while dragging
  - **Expected:** Gracefully handles zoom, likely cancels drag

- [ ] **Test 7.3:** Rapid successive drags
  - **Steps:** Quickly drag multiple nodes in succession
  - **Expected:**
    - Each drag completes properly
    - Visual feedback clears between drags
    - No visual artifacts left behind

### 8. Browser Compatibility
- [ ] **Test 8.1:** Chrome/Edge
- [ ] **Test 8.2:** Firefox
- [ ] **Test 8.3:** Safari (if available)

## Visual Verification Checklist

### Screenshot Requirements
Take screenshots of:
1. [ ] Node being dragged (showing 50% opacity ghost)
2. [ ] Valid drop target with green feedback
3. [ ] Invalid drop target with red feedback
4. [ ] Before and after successful node move
5. [ ] Large tree with drag in progress

## Regression Tests

### Verify No Breaking Changes
- [ ] Create new node works
- [ ] Edit node details works
- [ ] Delete node works
- [ ] Save/load view state works
- [ ] Expand/collapse persists across page reload
- [ ] Zoom/pan position persists across page reload

## Known Limitations (Document if found)
- [ ] Any browser-specific issues?
- [ ] Any performance issues with very large trees (100+ nodes)?
- [ ] Any issues with touch devices (if applicable)?

## Test Results
**Date Tested:** _________________  
**Tester:** _________________  
**Browser/Version:** _________________  
**Pass/Fail:** _________________  
**Notes:**

---

## Developer Notes

### If Issues Found
1. Check browser console for errors
2. Check network tab for failed API calls
3. Take screenshots of unexpected behavior
4. Note specific steps to reproduce
5. Check if issue occurs in multiple browsers

### Performance Profiling (if needed)
1. Open Chrome DevTools
2. Go to Performance tab
3. Record while dragging nodes
4. Look for:
   - Frame drops (should stay near 60fps)
   - Long tasks (should be < 16ms)
   - Excessive function calls in handleNodeDrag

### Debugging Tips
1. Visual feedback not showing:
   - Check if `isDragging`, `dropTargetNodeId`, `isValidDropTarget` are updating
   - Inspect element to see if CSS classes are applied

2. Drag not working:
   - Check if `@node-drag-start` event is firing
   - Verify Vue Flow version compatibility

3. Invalid drops allowed:
   - Check validation logic in handleNodeDrag
   - Verify isDescendant function works correctly
