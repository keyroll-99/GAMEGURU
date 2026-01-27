-- CreateIndex
CREATE INDEX "node_story_links_node_id_idx" ON "node_story_links"("node_id");

-- CreateIndex
CREATE INDEX "node_story_links_story_element_id_idx" ON "node_story_links"("story_element_id");

-- CreateIndex
CREATE INDEX "story_connections_from_element_id_idx" ON "story_connections"("from_element_id");

-- CreateIndex
CREATE INDEX "story_connections_to_element_id_idx" ON "story_connections"("to_element_id");
