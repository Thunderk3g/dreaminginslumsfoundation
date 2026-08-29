-- 004 · Two section types the design introduced.
--
-- `ticker`   the scrolling word marquee under the hero
-- `timeline` the centre-line milestone list
--
-- Both carry real editable copy, so they are sections an editor owns rather
-- than decoration hardcoded into a component. Adding a type means rewriting
-- this one CHECK; the matching declarations are in src/lib/blocks.ts.

alter table page_blocks drop constraint page_blocks_type_known;

alter table page_blocks add constraint page_blocks_type_known check (block_type in (
  'hero_slider',
  'ticker',
  'story',
  'teaser_cards',
  'impact_stats',
  'achievement_rail',
  'gallery_grid',
  'team_rail',
  'dreamer_rail',
  'timeline',
  'program_list',
  'rich_text',
  'image_banner',
  'donate_cta',
  'partner_logos',
  'contact_details'
));

-- The palette moves to the one taken from the design: deep violet ink on warm
-- paper, with gold as the single accent. Only applied where the row is still
-- untouched, so a site whose colours someone has already changed keeps them.
update settings
   set value = value || '{
         "color_primary":   "#3C1A6E",
         "color_secondary": "#6A3AD6",
         "color_accent":    "#F5B800",
         "color_ink":       "#17092E",
         "color_paper":     "#F4EFE4"
       }'::jsonb,
       updated_at = now()
 where key = 'brand'
   and value->>'color_primary' = '#5B2E91';
