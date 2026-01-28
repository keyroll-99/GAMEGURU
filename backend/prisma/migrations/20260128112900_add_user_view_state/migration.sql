-- CreateTable
CREATE TABLE "user_view_states" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "view_type" VARCHAR(50) NOT NULL DEFAULT 'mindmap',
    "zoom" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "pan_x" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "pan_y" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "expanded_nodes" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_view_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_view_states_user_id_idx" ON "user_view_states"("user_id");

-- CreateIndex
CREATE INDEX "user_view_states_project_id_idx" ON "user_view_states"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_view_states_user_id_project_id_key" ON "user_view_states"("user_id", "project_id");

-- AddForeignKey
ALTER TABLE "user_view_states" ADD CONSTRAINT "user_view_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_view_states" ADD CONSTRAINT "user_view_states_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
