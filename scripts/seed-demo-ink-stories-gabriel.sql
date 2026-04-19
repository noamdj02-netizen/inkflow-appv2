-- Studio démo Ink Stories / Gabriel — un seul bloc pour supabase db query
DO $seed$
BEGIN
  DELETE FROM inkflow_flash_designs WHERE studio_id = 'demo-ink-stories-gabriel';
  DELETE FROM inkflow_vitrine_data WHERE studio_id = 'demo-ink-stories-gabriel';
  DELETE FROM inkflow_payment_settings WHERE studio_id = 'demo-ink-stories-gabriel';
  DELETE FROM inkflow_studios WHERE id = 'demo-ink-stories-gabriel';

  INSERT INTO inkflow_studios (
    id,
    email,
    name,
    studio_name,
    slug,
    bio,
    city,
    city_slug,
    country,
    lat,
    lng,
    styles,
    price_min,
    price_max,
    instagram,
    plan_type,
    subscription_status,
    is_discoverable,
    location_visible,
    vitrine_theme
  ) VALUES (
    'demo-ink-stories-gabriel',
    'contact@inkflow.me',
    'Gabriel',
    'Ink Stories',
    'ink-stories',
    'Studio de tatouage à Cergy, spécialisé en réalisme, fineline et couleur. Chaque pièce est unique, pensée avec toi.',
    'Cergy',
    'cergy',
    'FR',
    49.0356,
    2.0731,
    ARRAY['realisme', 'fineline', 'couleur', 'piercing'],
    80,
    800,
    '_ink.stories_',
    'pro',
    'active',
    true,
    true,
    'dark'
  );

  INSERT INTO inkflow_flash_designs (
    id, studio_id, title, description,
    price, deposit_amount, available,
    reserved, category, size,
    estimated_duration, featured, display_order
  ) VALUES
  (
    'demo-flash-1',
    'demo-ink-stories-gabriel',
    'Rose réaliste',
    'Rose en réalisme couleur, rendu photographique. Idéal poignet ou avant-bras.',
    150, 50, true, false,
    'couleur', 'small', 90, true, 1
  ),
  (
    'demo-flash-2',
    'demo-ink-stories-gabriel',
    'Lune fineline',
    'Lune en fineline minimaliste, trait fin et précis. Parfait cheville ou clavicule.',
    120, 40, true, false,
    'fineline', 'small', 60, true, 2
  ),
  (
    'demo-flash-3',
    'demo-ink-stories-gabriel',
    'Panthère réaliste',
    'Tête de panthère en noir et gris, rendu hyper-réaliste. Bras ou cuisse.',
    350, 100, true, false,
    'realisme', 'large', 180, true, 3
  ),
  (
    'demo-flash-4',
    'demo-ink-stories-gabriel',
    'Papillon couleur',
    'Papillon en couleurs vives, style réaliste. Épaule ou omoplate.',
    200, 60, true, false,
    'couleur', 'medium', 120, false, 4
  ),
  (
    'demo-flash-5',
    'demo-ink-stories-gabriel',
    'Serpent fineline',
    'Serpent enroulé en fineline, épuré et élégant. Avant-bras ou mollet.',
    180, 55, true, false,
    'fineline', 'medium', 90, false, 5
  );

  UPDATE inkflow_studios
  SET availability_settings = '{
    "customSlots": ["09:00","10:30","12:00","14:00","15:30","17:00"],
    "offDays": [0, 1],
    "bookingWindowDays": 60,
    "slotDuration": 90,
    "bufferTime": 15,
    "maxDailyBookings": 4,
    "advanceBookingDays": 1,
    "blockedRanges": []
  }'::jsonb
  WHERE id = 'demo-ink-stories-gabriel';

  INSERT INTO inkflow_payment_settings (studio_id, settings)
  VALUES (
    'demo-ink-stories-gabriel',
    '{
      "depositType": "fixed",
      "depositFixed": 50,
      "currency": "eur",
      "stripeConnected": true,
      "cancellationHours": 48,
      "isDepositNonRefundable": true
    }'::jsonb
  );

  INSERT INTO inkflow_vitrine_data (studio_id, data)
  VALUES (
    'demo-ink-stories-gabriel',
    '{
      "showFlash": true,
      "showProjects": true,
      "showReviews": true,
      "showTeam": false,
      "showPricing": true,
      "accentColor": "#00D4FF"
    }'::jsonb
  );
END
$seed$;
