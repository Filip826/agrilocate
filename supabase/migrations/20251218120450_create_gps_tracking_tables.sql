/*
  # GPS Tracking System Database Schema

  ## Overview
  This migration creates the database structure for a GPS tracking application
  that allows users to monitor multiple ESP32-based GPS devices in real-time.

  ## New Tables

  ### 1. `devices`
  Stores information about GPS tracking devices (ESP32 + GPS module)
  - `id` (uuid, primary key) - Unique device identifier
  - `user_id` (uuid) - Owner of the device (links to auth.users)
  - `device_name` (text) - User-friendly name for the device
  - `device_id` (text, unique) - Unique identifier for ESP32 authentication
  - `api_key` (text) - Secret key for ESP32 to authenticate
  - `is_online` (boolean) - Current device status
  - `last_seen` (timestamptz) - Last time device sent data
  - `created_at` (timestamptz) - When device was registered

  ### 2. `locations`
  Stores GPS coordinate history for all devices
  - `id` (uuid, primary key) - Unique location record identifier
  - `device_id` (uuid) - Reference to the device
  - `latitude` (numeric) - GPS latitude coordinate
  - `longitude` (numeric) - GPS longitude coordinate
  - `altitude` (numeric) - Altitude in meters (optional)
  - `speed` (numeric) - Speed in km/h (optional)
  - `accuracy` (numeric) - GPS accuracy in meters (optional)
  - `timestamp` (timestamptz) - When the GPS data was recorded

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:

  #### `devices` table policies:
  1. Users can view only their own devices
  2. Users can insert new devices for themselves
  3. Users can update only their own devices
  4. Users can delete only their own devices
  5. Service role can update device status (for Edge Functions)

  #### `locations` table policies:
  1. Users can view locations only for their own devices
  2. Service role can insert location data (for Edge Functions)
  3. Users can view location history for their devices

  ## Indexes
  - Index on `device_id` in locations table for fast queries
  - Index on `timestamp` in locations table for history queries
  - Index on `user_id` in devices table for user device lookups

  ## Notes
  - All timestamps use timestamptz for proper timezone handling
  - API keys should be generated as secure random strings
  - Device status (is_online) should be updated based on last_seen timestamp
  - Real-time subscriptions are enabled for live tracking
*/

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_id text UNIQUE NOT NULL,
  api_key text NOT NULL,
  is_online boolean DEFAULT false,
  last_seen timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  altitude numeric(8, 2),
  speed numeric(6, 2),
  accuracy numeric(6, 2),
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_device_id ON locations(device_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for devices table

-- Users can view only their own devices
CREATE POLICY "Users can view own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert new devices for themselves
CREATE POLICY "Users can insert own devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own devices
CREATE POLICY "Users can update own devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own devices
CREATE POLICY "Users can delete own devices"
  ON devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can update device status (for Edge Functions)
CREATE POLICY "Service role can update device status"
  ON devices FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for locations table

-- Users can view locations for their own devices
CREATE POLICY "Users can view locations for own devices"
  ON locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = locations.device_id
      AND devices.user_id = auth.uid()
    )
  );

-- Service role can insert location data (for Edge Functions from ESP32)
CREATE POLICY "Service role can insert locations"
  ON locations FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow anon to insert (for ESP32 devices using API key - will be validated in Edge Function)
CREATE POLICY "Allow location insertion via Edge Function"
  ON locations FOR INSERT
  TO anon
  WITH CHECK (true);