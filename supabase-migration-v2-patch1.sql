-- V2 Patch 1: Add lease_start to records
-- Run in Supabase SQL editor after supabase-migration-v2.sql

ALTER TABLE records ADD COLUMN IF NOT EXISTS lease_start date;
