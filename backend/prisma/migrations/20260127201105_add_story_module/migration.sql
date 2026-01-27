-- CreateEnum
CREATE TYPE "StoryElementType" AS ENUM ('OVERVIEW', 'ACT', 'SCENE', 'DIALOG', 'EVENT', 'CHARACTER');

-- CreateEnum
CREATE TYPE "StoryElementStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED');

-- CreateTable
CREATE TABLE "story_elements" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_id" UUID,
    "type" "StoryElementType" NOT NULL,
    "status" "StoryElementStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_connections" (
    "id" UUID NOT NULL,
    "from_element_id" UUID NOT NULL,
    "to_element_id" UUID NOT NULL,
    "label" VARCHAR(100),
    "connection_type" VARCHAR(50) NOT NULL DEFAULT 'leads_to',

    CONSTRAINT "story_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_story_links" (
    "id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "story_element_id" UUID NOT NULL,

    CONSTRAINT "node_story_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_history" (
    "id" UUID NOT NULL,
    "story_element_id" UUID NOT NULL,
    "field_name" VARCHAR(50) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "story_elements_project_id_idx" ON "story_elements"("project_id");

-- CreateIndex
CREATE INDEX "story_elements_parent_id_idx" ON "story_elements"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_connections_from_element_id_to_element_id_key" ON "story_connections"("from_element_id", "to_element_id");

-- CreateIndex
CREATE UNIQUE INDEX "node_story_links_node_id_story_element_id_key" ON "node_story_links"("node_id", "story_element_id");

-- CreateIndex
CREATE INDEX "story_history_story_element_id_idx" ON "story_history"("story_element_id");

-- AddForeignKey
ALTER TABLE "story_elements" ADD CONSTRAINT "story_elements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_elements" ADD CONSTRAINT "story_elements_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "story_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_connections" ADD CONSTRAINT "story_connections_from_element_id_fkey" FOREIGN KEY ("from_element_id") REFERENCES "story_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_connections" ADD CONSTRAINT "story_connections_to_element_id_fkey" FOREIGN KEY ("to_element_id") REFERENCES "story_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_story_links" ADD CONSTRAINT "node_story_links_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_story_links" ADD CONSTRAINT "node_story_links_story_element_id_fkey" FOREIGN KEY ("story_element_id") REFERENCES "story_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_history" ADD CONSTRAINT "story_history_story_element_id_fkey" FOREIGN KEY ("story_element_id") REFERENCES "story_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_history" ADD CONSTRAINT "story_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
