alter table publish_queue drop constraint publish_queue_status_check;
alter table publish_queue add constraint publish_queue_status_check
  check (status in ('pending','approved','uploading','uploaded_private','scheduled','published','failed'));
-- Defense in depth: nothing past 'pending' can exist without a recorded human approval.
alter table publish_queue add constraint publish_requires_approval
  check (status in ('pending','failed') or (approved_at is not null and approved_by is not null));
create unique index publish_queue_one_active on publish_queue (project_id) where status in ('approved','uploading','uploaded_private','scheduled','published');

create table quota_usage (
  day date primary key,
  units int not null default 0
);
