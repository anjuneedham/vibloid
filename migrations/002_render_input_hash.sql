alter table renders add column input_hash text;
create index renders_input_idx on renders (project_id, kind, input_hash);
