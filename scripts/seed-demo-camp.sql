-- =============================================================================
-- CAMPWISE DEMO DATA - Κατασκήνωση "Ήλιος"
-- =============================================================================
-- Τρέξε αυτό το script στο Supabase SQL Editor
-- ΣΗΜΑΝΤΙΚΟ: Πρέπει πρώτα να έχεις δημιουργήσει user και organization μέσω της εφαρμογής
-- Αυτό το script προσθέτει τα υπόλοιπα δεδομένα
-- =============================================================================

-- Πρώτα βρες το organization_id σου
-- SELECT id, name FROM organizations;

-- Αντικατέστησε το παρακάτω με το δικό σου organization_id
DO $$
DECLARE
  v_org_id UUID;
  v_session_id UUID;
  v_template_id UUID;

  -- Facilities
  v_pool_id UUID;
  v_football_id UUID;
  v_basketball_id UUID;
  v_volleyball_id UUID;
  v_craft_room_id UUID;
  v_theater_id UUID;
  v_music_room_id UUID;
  v_dining_id UUID;
  v_archery_id UUID;

  -- Activities
  v_act_football_id UUID;
  v_act_basketball_id UUID;
  v_act_volleyball_id UUID;
  v_act_swimming_id UUID;
  v_act_crafts_id UUID;
  v_act_theater_id UUID;
  v_act_music_id UUID;
  v_act_archery_id UUID;
  v_act_games_id UUID;
  v_act_dance_id UUID;

  -- Staff
  v_staff_yannis_id UUID;
  v_staff_maria_id UUID;
  v_staff_nikos_id UUID;
  v_staff_eleni_id UUID;
  v_staff_kostas_id UUID;
  v_staff_anna_id UUID;

  -- Groups
  v_group_aetoi_id UUID;
  v_group_liontaria_id UUID;
  v_group_delfinia_id UUID;
  v_group_tigris_id UUID;

BEGIN
  -- =============================================================================
  -- ΒΡΕΣ ΤΟ ORGANIZATION
  -- =============================================================================
  SELECT id INTO v_org_id FROM organizations WHERE deleted_at IS NULL LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Δεν βρέθηκε organization. Δημιούργησε πρώτα έναν οργανισμό μέσω της εφαρμογής.';
  END IF;

  RAISE NOTICE 'Χρησιμοποιώ organization: %', v_org_id;

  -- =============================================================================
  -- 1. ΔΗΜΙΟΥΡΓΙΑ ΠΕΡΙΟΔΟΥ (SESSION)
  -- =============================================================================
  v_session_id := uuid_generate_v4();

  INSERT INTO sessions (id, organization_id, name, description, start_date, end_date, status, max_campers)
  VALUES (
    v_session_id,
    v_org_id,
    '1η Θερινή Περίοδος 2025',
    'Πρώτη περίοδος καλοκαιρινής κατασκήνωσης',
    '2025-07-01',
    '2025-07-15',
    'planning',
    120
  );

  RAISE NOTICE 'Δημιουργήθηκε περίοδος: %', v_session_id;

  -- =============================================================================
  -- 2. ΔΗΜΙΟΥΡΓΙΑ ΧΩΡΩΝ (FACILITIES)
  -- =============================================================================

  -- Πισίνα
  v_pool_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_pool_id, v_org_id, 'Πισίνα', 'POOL', 'Κεντρική πισίνα με ναυαγοσώστη', 30, false, true);

  -- Γήπεδο Ποδοσφαίρου
  v_football_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_football_id, v_org_id, 'Γήπεδο Ποδοσφαίρου', 'FTBL', 'Χορτοτάπητας 11x11', 44, false, true);

  -- Γήπεδο Μπάσκετ
  v_basketball_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_basketball_id, v_org_id, 'Γήπεδο Μπάσκετ', 'BSKT', 'Ανοιχτό γήπεδο μπάσκετ', 20, false, true);

  -- Γήπεδο Βόλεϊ
  v_volleyball_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_volleyball_id, v_org_id, 'Γήπεδο Βόλεϊ', 'VLBL', 'Γήπεδο beach volley', 16, false, true);

  -- Αίθουσα Χειροτεχνίας
  v_craft_room_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_craft_room_id, v_org_id, 'Αίθουσα Χειροτεχνίας', 'CRFT', 'Κλιματιζόμενη αίθουσα με υλικά', 25, true, true);

  -- Αμφιθέατρο
  v_theater_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_theater_id, v_org_id, 'Αμφιθέατρο', 'THTR', 'Υπαίθριο αμφιθέατρο για παραστάσεις', 100, false, true);

  -- Αίθουσα Μουσικής
  v_music_room_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_music_room_id, v_org_id, 'Αίθουσα Μουσικής', 'MUSC', 'Αίθουσα με όργανα', 20, true, true);

  -- Τραπεζαρία
  v_dining_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_dining_id, v_org_id, 'Τραπεζαρία', 'DINE', 'Κεντρική τραπεζαρία', 150, true, true);

  -- Χώρος Τοξοβολίας
  v_archery_id := uuid_generate_v4();
  INSERT INTO facilities (id, organization_id, name, code, description, capacity, indoor, is_active)
  VALUES (v_archery_id, v_org_id, 'Πεδίο Τοξοβολίας', 'ARCH', 'Ασφαλής χώρος τοξοβολίας', 12, false, true);

  RAISE NOTICE 'Δημιουργήθηκαν 9 χώροι';

  -- =============================================================================
  -- 3. ΔΗΜΙΟΥΡΓΙΑ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ (ACTIVITIES)
  -- =============================================================================

  -- Ποδόσφαιρο
  v_act_football_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_football_id, v_org_id, 'Ποδόσφαιρο', 'FTBL', 'Αγώνας ποδοσφαίρου 5x5 ή 7x7', 60, 10, 22, '#22C55E', true, true);

  -- Μπάσκετ
  v_act_basketball_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_basketball_id, v_org_id, 'Μπάσκετ', 'BSKT', 'Αγώνας μπάσκετ 3x3 ή 5x5', 60, 6, 20, '#F97316', true, true);

  -- Βόλεϊ
  v_act_volleyball_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_volleyball_id, v_org_id, 'Βόλεϊ', 'VLBL', 'Beach volley', 45, 6, 16, '#EAB308', true, true);

  -- Κολύμβηση
  v_act_swimming_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, required_staff_count, color, is_active, weather_dependent)
  VALUES (v_act_swimming_id, v_org_id, 'Κολύμβηση', 'SWIM', 'Μάθημα κολύμβησης ή ελεύθερη κολύμβηση', 45, 8, 15, 2, '#0EA5E9', true, true);

  -- Χειροτεχνία
  v_act_crafts_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_crafts_id, v_org_id, 'Χειροτεχνία', 'CRFT', 'Κατασκευές, ζωγραφική, origami', 60, 8, 25, '#A855F7', true, false);

  -- Θέατρο
  v_act_theater_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_theater_id, v_org_id, 'Θέατρο', 'THTR', 'Θεατρικό παιχνίδι και πρόβες', 90, 10, 30, '#EC4899', true, false);

  -- Μουσική
  v_act_music_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_music_id, v_org_id, 'Μουσική', 'MUSC', 'Τραγούδι, ρυθμός, μουσικά όργανα', 45, 8, 20, '#6366F1', true, false);

  -- Τοξοβολία
  v_act_archery_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, required_staff_count, color, is_active, weather_dependent)
  VALUES (v_act_archery_id, v_org_id, 'Τοξοβολία', 'ARCH', 'Εκμάθηση τοξοβολίας με εποπτεία', 45, 6, 12, 2, '#EF4444', true, true);

  -- Επιτραπέζια Παιχνίδια
  v_act_games_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_games_id, v_org_id, 'Επιτραπέζια', 'GAME', 'Επιτραπέζια παιχνίδια και σκάκι', 45, 4, 20, '#14B8A6', true, false);

  -- Χορός
  v_act_dance_id := uuid_generate_v4();
  INSERT INTO activities (id, organization_id, name, code, description, duration_minutes, min_participants, max_participants, color, is_active, weather_dependent)
  VALUES (v_act_dance_id, v_org_id, 'Χορός', 'DANC', 'Παραδοσιακοί και μοντέρνοι χοροί', 60, 10, 30, '#D946EF', true, false);

  RAISE NOTICE 'Δημιουργήθηκαν 10 δραστηριότητες';

  -- =============================================================================
  -- 4. ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΣΩΠΙΚΟΥ (STAFF)
  -- =============================================================================

  -- Γιάννης - Αθλητικός Εκπαιδευτής
  v_staff_yannis_id := uuid_generate_v4();
  INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, is_active)
  VALUES (v_staff_yannis_id, v_org_id, 'Γιάννης', 'Παπαδόπουλος', 'yannis@camp.gr', '6971234567', 'instructor', true);

  -- Μαρία - Ναυαγοσώστρια
  v_staff_maria_id := uuid_generate_v4();
  INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, certifications, is_active)
  VALUES (v_staff_maria_id, v_org_id, 'Μαρία', 'Κωνσταντίνου', 'maria@camp.gr', '6972345678', 'instructor', ARRAY['lifeguard', 'first_aid'], true);

  -- Νίκος - Τέχνες
  v_staff_nikos_id := uuid_generate_v4();
  INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, is_active)
  VALUES (v_staff_nikos_id, v_org_id, 'Νίκος', 'Αντωνίου', 'nikos@camp.gr', '6973456789', 'instructor', true);

  -- Ελένη - Σύμβουλος
  v_staff_eleni_id := uuid_generate_v4();
  INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, is_active)
  VALUES (v_staff_eleni_id, v_org_id, 'Ελένη', 'Δημητρίου', 'eleni@camp.gr', '6974567890', 'supervisor', true);

  -- Κώστας - Συντονιστής
  v_staff_kostas_id := uuid_generate_v4();
  INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, is_active)
  VALUES (v_staff_kostas_id, v_org_id, 'Κώστας', 'Γεωργίου', 'kostas@camp.gr', '6975678901', 'coordinator', true);

  -- Άννα - Μουσική/Χορός
  v_staff_anna_id := uuid_generate_v4();
  INSERT INTO staff (id, organization_id, first_name, last_name, email, phone, role, is_active)
  VALUES (v_staff_anna_id, v_org_id, 'Άννα', 'Νικολάου', 'anna@camp.gr', '6976789012', 'instructor', true);

  RAISE NOTICE 'Δημιουργήθηκαν 6 μέλη προσωπικού';

  -- =============================================================================
  -- 5. ΔΗΜΙΟΥΡΓΙΑ ΟΜΑΔΩΝ (GROUPS)
  -- =============================================================================

  -- Αετοί - 8-10 ετών
  v_group_aetoi_id := uuid_generate_v4();
  INSERT INTO groups (id, session_id, name, code, description, color, age_min, age_max, capacity, gender, is_active)
  VALUES (v_group_aetoi_id, v_session_id, 'Αετοί', 'AET', 'Μικρά παιδιά 8-10 ετών', '#3B82F6', 8, 10, 20, 'mixed', true);

  -- Λιοντάρια - 11-13 ετών
  v_group_liontaria_id := uuid_generate_v4();
  INSERT INTO groups (id, session_id, name, code, description, color, age_min, age_max, capacity, gender, is_active)
  VALUES (v_group_liontaria_id, v_session_id, 'Λιοντάρια', 'LIO', 'Μεσαία παιδιά 11-13 ετών', '#F59E0B', 11, 13, 22, 'mixed', true);

  -- Δελφίνια - 8-10 ετών (κορίτσια)
  v_group_delfinia_id := uuid_generate_v4();
  INSERT INTO groups (id, session_id, name, code, description, color, age_min, age_max, capacity, gender, is_active)
  VALUES (v_group_delfinia_id, v_session_id, 'Δελφίνια', 'DEL', 'Κορίτσια 8-10 ετών', '#EC4899', 8, 10, 18, 'female', true);

  -- Τίγρεις - 11-13 ετών (αγόρια)
  v_group_tigris_id := uuid_generate_v4();
  INSERT INTO groups (id, session_id, name, code, description, color, age_min, age_max, capacity, gender, is_active)
  VALUES (v_group_tigris_id, v_session_id, 'Τίγρεις', 'TIG', 'Αγόρια 11-13 ετών', '#22C55E', 11, 13, 20, 'male', true);

  RAISE NOTICE 'Δημιουργήθηκαν 4 ομάδες';

  -- =============================================================================
  -- 6. ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΤΥΠΟΥ ΗΜΕΡΑΣ (DAY TEMPLATE)
  -- =============================================================================

  v_template_id := uuid_generate_v4();

  INSERT INTO day_templates (id, organization_id, name, description, is_default, total_activity_slots, is_active)
  VALUES (v_template_id, v_org_id, 'Κανονική Ημέρα', 'Τυπική ημέρα κατασκήνωσης με 6 δραστηριότητες', true, 6, true);

  -- Slots Προτύπου
  INSERT INTO day_template_slots (day_template_id, name, start_time, end_time, slot_type, is_schedulable, sort_order) VALUES
    (v_template_id, 'Πρωινό', '08:00', '08:30', 'meal', false, 1),
    (v_template_id, 'Δραστηριότητα 1', '08:30', '09:30', 'activity', true, 2),
    (v_template_id, 'Δραστηριότητα 2', '09:30', '10:30', 'activity', true, 3),
    (v_template_id, 'Διάλειμμα', '10:30', '11:00', 'break', false, 4),
    (v_template_id, 'Δραστηριότητα 3', '11:00', '12:00', 'activity', true, 5),
    (v_template_id, 'Δραστηριότητα 4', '12:00', '13:00', 'activity', true, 6),
    (v_template_id, 'Μεσημεριανό', '13:00', '14:00', 'meal', false, 7),
    (v_template_id, 'Ξεκούραση', '14:00', '15:00', 'rest', false, 8),
    (v_template_id, 'Δραστηριότητα 5', '15:00', '16:00', 'activity', true, 9),
    (v_template_id, 'Δραστηριότητα 6', '16:00', '17:00', 'activity', true, 10),
    (v_template_id, 'Ελεύθερος Χρόνος', '17:00', '17:30', 'free', false, 11);

  RAISE NOTICE 'Δημιουργήθηκε πρότυπο ημέρας με 11 slots';

  -- =============================================================================
  -- 7. ΔΗΜΙΟΥΡΓΙΑ ΠΕΡΙΟΡΙΣΜΩΝ (CONSTRAINTS)
  -- =============================================================================

  -- Κολύμβηση μόνο πρωί (10:00-12:00)
  INSERT INTO constraints (organization_id, name, description, constraint_type, is_hard, priority, is_active, scope, condition)
  VALUES (
    v_org_id,
    'Κολύμβηση μόνο πρωί',
    'Η κολύμβηση επιτρέπεται μόνο 08:30-12:00 για λόγους ασφαλείας',
    'time_restriction',
    true,
    10,
    true,
    jsonb_build_object('activity_ids', ARRAY[v_act_swimming_id]),
    jsonb_build_object('start_time', '08:30', 'end_time', '12:00')
  );

  -- Πισίνα: 1 ομάδα κάθε φορά
  INSERT INTO constraints (organization_id, name, description, constraint_type, is_hard, priority, is_active, scope)
  VALUES (
    v_org_id,
    'Πισίνα: 1 ομάδα',
    'Μόνο μία ομάδα στην πισίνα κάθε φορά για ασφάλεια',
    'facility_exclusive',
    true,
    10,
    true,
    jsonb_build_object('facility_ids', ARRAY[v_pool_id])
  );

  -- Μέγιστο 2 κολύμπι/ημέρα ανά ομάδα
  INSERT INTO constraints (organization_id, name, description, constraint_type, is_hard, priority, is_active, scope, condition)
  VALUES (
    v_org_id,
    'Μέγιστο 2 κολύμπι/ημέρα',
    'Κάθε ομάδα κάνει μέχρι 2 κολύμπι την ημέρα',
    'daily_limit',
    false,
    7,
    true,
    jsonb_build_object('activity_ids', ARRAY[v_act_swimming_id]),
    jsonb_build_object('limit', 2)
  );

  -- Τουλάχιστον 1 αθλητική/ημέρα
  INSERT INTO constraints (organization_id, name, description, constraint_type, is_hard, priority, is_active, scope, condition)
  VALUES (
    v_org_id,
    'Τουλάχιστον 1 αθλητική',
    'Κάθε ομάδα πρέπει να έχει τουλάχιστον 1 αθλητική δραστηριότητα την ημέρα',
    'daily_minimum',
    false,
    6,
    true,
    jsonb_build_object('activity_ids', ARRAY[v_act_football_id, v_act_basketball_id, v_act_volleyball_id]),
    jsonb_build_object('limit', 1)
  );

  RAISE NOTICE 'Δημιουργήθηκαν 4 περιορισμοί';

  -- =============================================================================
  -- 8. ΔΗΜΙΟΥΡΓΙΑ ΠΑΡΑΔΕΙΓΜΑΤΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ (1 ΗΜΕΡΑ)
  -- =============================================================================

  -- Δευτέρα 1 Ιουλίου - Αετοί
  INSERT INTO schedule_slots (session_id, date, start_time, end_time, group_id, activity_id, facility_id, status, generation_method) VALUES
    (v_session_id, '2025-07-01', '08:30', '09:30', v_group_aetoi_id, v_act_football_id, v_football_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '09:30', '10:30', v_group_aetoi_id, v_act_swimming_id, v_pool_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '11:00', '12:00', v_group_aetoi_id, v_act_crafts_id, v_craft_room_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '12:00', '13:00', v_group_aetoi_id, v_act_music_id, v_music_room_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '15:00', '16:00', v_group_aetoi_id, v_act_theater_id, v_theater_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '16:00', '17:00', v_group_aetoi_id, v_act_games_id, v_craft_room_id, 'scheduled', 'manual');

  -- Δευτέρα 1 Ιουλίου - Λιοντάρια
  INSERT INTO schedule_slots (session_id, date, start_time, end_time, group_id, activity_id, facility_id, status, generation_method) VALUES
    (v_session_id, '2025-07-01', '08:30', '09:30', v_group_liontaria_id, v_act_swimming_id, v_pool_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '09:30', '10:30', v_group_liontaria_id, v_act_basketball_id, v_basketball_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '11:00', '12:00', v_group_liontaria_id, v_act_archery_id, v_archery_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '12:00', '13:00', v_group_liontaria_id, v_act_crafts_id, v_craft_room_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '15:00', '16:00', v_group_liontaria_id, v_act_volleyball_id, v_volleyball_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '16:00', '17:00', v_group_liontaria_id, v_act_dance_id, v_theater_id, 'scheduled', 'manual');

  -- Δευτέρα 1 Ιουλίου - Δελφίνια
  INSERT INTO schedule_slots (session_id, date, start_time, end_time, group_id, activity_id, facility_id, status, generation_method) VALUES
    (v_session_id, '2025-07-01', '08:30', '09:30', v_group_delfinia_id, v_act_crafts_id, v_craft_room_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '09:30', '10:30', v_group_delfinia_id, v_act_music_id, v_music_room_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '11:00', '12:00', v_group_delfinia_id, v_act_swimming_id, v_pool_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '12:00', '13:00', v_group_delfinia_id, v_act_dance_id, v_theater_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '15:00', '16:00', v_group_delfinia_id, v_act_volleyball_id, v_volleyball_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '16:00', '17:00', v_group_delfinia_id, v_act_theater_id, v_theater_id, 'scheduled', 'manual');

  -- Δευτέρα 1 Ιουλίου - Τίγρεις
  INSERT INTO schedule_slots (session_id, date, start_time, end_time, group_id, activity_id, facility_id, status, generation_method) VALUES
    (v_session_id, '2025-07-01', '08:30', '09:30', v_group_tigris_id, v_act_basketball_id, v_basketball_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '09:30', '10:30', v_group_tigris_id, v_act_archery_id, v_archery_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '11:00', '12:00', v_group_tigris_id, v_act_football_id, v_football_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '12:00', '13:00', v_group_tigris_id, v_act_swimming_id, v_pool_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '15:00', '16:00', v_group_tigris_id, v_act_crafts_id, v_craft_room_id, 'scheduled', 'manual'),
    (v_session_id, '2025-07-01', '16:00', '17:00', v_group_tigris_id, v_act_music_id, v_music_room_id, 'scheduled', 'manual');

  RAISE NOTICE 'Δημιουργήθηκε πρόγραμμα για 1 ημέρα (4 ομάδες x 6 slots = 24 εγγραφές)';

  -- =============================================================================
  -- ΟΛΟΚΛΗΡΩΣΗ
  -- =============================================================================
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Η εισαγωγή ολοκληρώθηκε επιτυχώς!';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Δημιουργήθηκαν:';
  RAISE NOTICE '  - 1 Περίοδος (1η Θερινή 2025)';
  RAISE NOTICE '  - 9 Χώροι';
  RAISE NOTICE '  - 10 Δραστηριότητες';
  RAISE NOTICE '  - 6 Μέλη Προσωπικού';
  RAISE NOTICE '  - 4 Ομάδες (Αετοί, Λιοντάρια, Δελφίνια, Τίγρεις)';
  RAISE NOTICE '  - 1 Πρότυπο Ημέρας με 11 slots';
  RAISE NOTICE '  - 4 Περιορισμοί';
  RAISE NOTICE '  - 24 Προγραμματισμένες Δραστηριότητες (1 ημέρα)';
  RAISE NOTICE '=========================================';
  RAISE NOTICE 'Τώρα πήγαινε στο /dashboard/schedule για να δεις το πρόγραμμα!';

END $$;
