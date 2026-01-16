-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('ROOT', 'TASK', 'MILESTONE');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "nodes" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_id" UUID,
    "type" "NodeType" NOT NULL DEFAULT 'TASK',
    "status" "NodeStatus" NOT NULL DEFAULT 'TODO',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_assignees" (
    "node_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "node_assignees_pkey" PRIMARY KEY ("node_id","user_id")
);

-- CreateTable
CREATE TABLE "node_history" (
    "id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "field_name" VARCHAR(50) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "node_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nodes_project_id_idx" ON "nodes"("project_id");

-- CreateIndex
CREATE INDEX "nodes_parent_id_idx" ON "nodes"("parent_id");

-- CreateIndex
CREATE INDEX "node_history_node_id_idx" ON "node_history"("node_id");

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_assignees" ADD CONSTRAINT "node_assignees_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_assignees" ADD CONSTRAINT "node_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_history" ADD CONSTRAINT "node_history_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_history" ADD CONSTRAINT "node_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
