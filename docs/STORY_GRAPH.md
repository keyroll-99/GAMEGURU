# Story Graph Feature Documentation

## Overview
The Story Graph feature provides a visual representation of story elements and their connections in a graph format. It allows users to see the flow of their story, create connections between elements, and navigate the story structure visually.

## User Guide

### Accessing the Story Graph
1. Navigate to a project's story view: `/projects/:id/story`
2. Click the "🕸️ Graf fabularny" button in the header
3. You'll be redirected to `/projects/:id/story/graph`

### Graph Features

#### Viewing Story Elements
- Each story element is displayed as a node on the graph
- Nodes show:
  - Type badge (emoji) at the top
  - Title in the center
  - Status indicator (circle) in the top-right

#### Node Types & Colors
- **ACT** (🎭): Blue left border
- **SCENE** (🎬): Green left border
- **EVENT** (⚡): Orange left border
- **DIALOG** (💬): Purple left border
- **CHARACTER** (👤): Pink left border
- **OVERVIEW** (📋): Gray left border

#### Status Colors
- **DRAFT**: Gray background
- **IN_PROGRESS**: Yellow background
- **REVIEW**: Blue background
- **COMPLETED**: Green background (with reduced opacity)

#### Connections (Edges)
Connections between elements are shown as lines with different styles:
- **Leads to**: Solid blue line (animated)
- **Branches to**: Dashed orange line
- **Requires**: Dotted purple line

### Interactions

#### Selecting a Node
Click on any node to:
- Highlight it with a purple border
- Open the side panel with element details
- See the element's type, status, and content

#### Creating a Connection
1. Hover over a node
2. Click and drag from the right handle (small circle on the right side)
3. Drop onto another node's left handle
4. A modal will appear asking for:
   - Label (optional): A descriptive text for the connection
   - Type: Choose from "Prowadzi do", "Rozgałęzienie do", or "Wymaga"
5. Click "Utwórz" to create the connection

#### Deleting a Connection
1. Click on the connection line (edge)
2. Confirm the deletion in the dialog
3. The connection will be removed

#### Opening in Editor
1. Select a node
2. In the side panel, click "Otwórz w edytorze"
3. You'll be taken to the story list view with the element selected

### Navigation Controls

#### Zoom and Pan
- Use mouse wheel to zoom in/out
- Click and drag on empty space to pan the view
- Use the controls in the top-right:
  - "+" to zoom in
  - "-" to zoom out
  - "⊡" to fit all nodes in view

#### Mini Map
- A mini map in the bottom-right shows the full graph
- Click on the mini map to navigate to that area

### Loading States

#### Loading
When the graph is loading data, you'll see:
- A spinner animation
- "Ładowanie grafu..." message

#### Error
If there's an error loading the graph:
- An error message will be displayed
- Click "Spróbuj ponownie" to retry

#### Empty State
If there are no story elements:
- An empty state message is shown
- Click "Przejdź do listy" to add elements

## Technical Details

### Graph Layout
The graph uses the Dagre algorithm for automatic layout:
- Nodes are arranged left-to-right (LR direction)
- Spacing: 100px between nodes, 150px between ranks
- Margins: 50px on all sides

### Performance
- The layout is recalculated when data changes
- Suitable for stories with up to ~100 elements
- For larger stories, consider organizing into multiple acts

### Browser Compatibility
- Works in all modern browsers
- Requires JavaScript enabled
- Best experience on desktop (larger screen)

## API Integration

### Endpoints Used
- `GET /projects/:projectId/story/graph` - Fetch elements and connections
- `POST /story/:id/connections` - Create a new connection
- `DELETE /story/connections/:id` - Delete a connection

### Data Structure
```typescript
// Graph Data
{
  elements: StoryElement[],
  connections: StoryConnection[]
}

// StoryElement
{
  id: string
  type: 'ACT' | 'SCENE' | 'EVENT' | 'DIALOG' | 'CHARACTER' | 'OVERVIEW'
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
  title: string
  content: string | null
}

// StoryConnection
{
  id: string
  from_element_id: string
  to_element_id: string
  label: string | null
  connection_type: 'leads_to' | 'branches_to' | 'requires'
}
```

## Keyboard Shortcuts
Currently, all interactions are mouse-based. Keyboard shortcuts may be added in future versions.

## Known Limitations
1. Nodes cannot be manually repositioned (auto-layout only)
2. Cannot create circular connections (enforced by backend)
3. Cannot edit connection labels after creation (must delete and recreate)
4. Side panel shows basic info only (use editor for full details)

## Troubleshooting

### Graph not loading
- Check internet connection
- Verify you have access to the project
- Try refreshing the page
- Check browser console for errors

### Cannot create connection
- Ensure you're dragging from source (right) to target (left) handle
- Verify both elements are in the same project
- Check if the connection already exists

### Nodes overlapping
- Click the "⊡" (fit view) button to reset the view
- The layout algorithm should prevent overlaps
- If issues persist, try reloading the page

## Future Enhancements
Potential features for future versions:
- Manual node positioning
- Connection label editing
- Multiple connection types at once
- Export graph as image
- Keyboard shortcuts for navigation
- Filtering by type/status
- Search within graph
- Zoom to specific node
