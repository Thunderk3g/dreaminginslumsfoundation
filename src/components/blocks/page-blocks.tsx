import { Fragment } from "react";
import { id, ids, n, rows } from "@/lib/fields";
import type { Block, PageKey } from "@/lib/blocks";
import type { ContentItem } from "@/lib/records";
import { getChrome, getMediaMeta, getPageBlocks, pickItems, type MediaMeta } from "@/server/cms";
import {
  AchievementRailBlock,
  ContactDetailsBlock,
  DonateCtaBlock,
  DreamerRailBlock,
  GalleryGridBlock,
  HeroSliderBlock,
  ImageBannerBlock,
  ImpactStatsBlock,
  PartnerLogosBlock,
  ProgramListBlock,
  RichTextBlock,
  StoryBlock,
  TeamRailBlock,
  TeaserCardsBlock,
  TickerBlock,
  TimelineBlock,
} from "./sections";

/**
 * Renders a page from whatever the console has put on it.
 *
 * Two rules shape this module:
 *
 *   1. Every block's data is fetched in one `Promise.all` across all blocks.
 *      Awaiting inside the render loop would serialise a homepage into six
 *      sequential round trips to the database.
 *   2. Every media id on the page is collected first and looked up in one
 *      query, including the ids buried inside repeating rows and inside the
 *      content rows a block pulls in.
 */

type Payload = { kind: "none" } | { kind: "items"; items: ContentItem[] };

async function load(block: Block): Promise<Payload> {
  const { data } = block;

  switch (block.block_type) {
    case "impact_stats":
      return { kind: "items", items: await pickItems("impact_stat", ids(data, "stat_ids")) };

    case "achievement_rail":
      return {
        kind: "items",
        items: await pickItems("achievement", ids(data, "achievement_ids"), n(data, "limit", 6)),
      };

    case "gallery_grid":
      return {
        kind: "items",
        items: await pickItems("gallery_photo", ids(data, "photo_ids"), n(data, "limit", 18)),
      };

    case "team_rail":
      return { kind: "items", items: await pickItems("team_member", ids(data, "member_ids")) };

    case "dreamer_rail":
      return {
        kind: "items",
        items: await pickItems("dreamer_story", ids(data, "story_ids"), n(data, "limit", 6)),
      };

    case "partner_logos":
      return { kind: "items", items: await pickItems("partner", ids(data, "partner_ids")) };

    default:
      return { kind: "none" };
  }
}

/** Every media id a block will paint, including the ones nested in its rows. */
function mediaIdsOf(block: Block, payload: Payload): string[] {
  const out: string[] = [];
  const push = (value: string | null) => {
    if (value) out.push(value);
  };

  push(id(block.data, "media_id"));
  push(id(block.data, "qr_media_id"));

  for (const key of ["slides", "cards"]) {
    for (const row of rows(block.data, key)) push(id(row, "media_id"));
  }

  if (payload.kind === "items") {
    for (const item of payload.items) push(id(item.data, "media_id"));
  }

  return out;
}

function render(
  block: Block,
  payload: Payload,
  media: Record<string, MediaMeta>,
  site: { email: string; phone: string; address: string }
) {
  const { data } = block;
  const items = payload.kind === "items" ? payload.items : [];

  switch (block.block_type) {
    case "hero_slider":
      return <HeroSliderBlock data={data} media={media} />;
    case "ticker":
      return <TickerBlock data={data} />;
    case "timeline":
      return <TimelineBlock data={data} />;
    case "story":
      return <StoryBlock data={data} media={media} />;
    case "teaser_cards":
      return <TeaserCardsBlock data={data} media={media} />;
    case "impact_stats":
      return <ImpactStatsBlock data={data} items={items} />;
    case "achievement_rail":
      return <AchievementRailBlock data={data} items={items} media={media} />;
    case "gallery_grid":
      return <GalleryGridBlock data={data} items={items} media={media} />;
    case "team_rail":
      return <TeamRailBlock data={data} items={items} media={media} />;
    case "dreamer_rail":
      return <DreamerRailBlock data={data} items={items} media={media} />;
    case "program_list":
      return <ProgramListBlock data={data} />;
    case "rich_text":
      return <RichTextBlock data={data} />;
    case "image_banner":
      return <ImageBannerBlock data={data} media={media} />;
    case "donate_cta":
      return <DonateCtaBlock data={data} media={media} />;
    case "partner_logos":
      return <PartnerLogosBlock data={data} items={items} media={media} />;
    case "contact_details":
      return <ContactDetailsBlock data={data} site={site} />;
  }
}

export async function PageBlocks({ pageKey }: { pageKey: PageKey }) {
  const blocks = await getPageBlocks(pageKey);
  if (!blocks.length) return null;

  // The content each block needs, and the chrome, all in flight at once.
  const [payloads, chrome] = await Promise.all([Promise.all(blocks.map(load)), getChrome()]);

  // Only now are every block's media ids knowable — the ones inside content
  // rows are not visible until those rows have been fetched.
  const mediaIds = [...new Set(blocks.flatMap((block, i) => mediaIdsOf(block, payloads[i])))];
  const media = await getMediaMeta(mediaIds);

  const site = {
    email: chrome.site.email,
    phone: chrome.site.phone,
    address: chrome.site.address,
  };

  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={block.id}>{render(block, payloads[i], media, site)}</Fragment>
      ))}
    </>
  );
}
