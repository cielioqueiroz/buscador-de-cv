-- 0011_application_details.sql — data da entrevista no tracker.
--
-- `notes` já existia desde a 0003 sem nunca ser usada; agora a interface
-- grava anotações nela. `interview_on` é só a data (o campo da tela é um
-- <input type="date">): sem fuso para deslocar o dia.
-- O estágio "recusado" é só um novo valor do texto `stage`, sem DDL.

alter table applications add column if not exists interview_on date;

insert into schema_migrations (name) values ('0011_application_details.sql')
on conflict (name) do nothing;
