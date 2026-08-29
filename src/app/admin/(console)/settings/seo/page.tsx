import { readSeo } from "@/lib/site-settings";
import { getSettingRaw } from "@/server/cms";
import { listMedia } from "@/server/admin-cms";
import { ActionForm } from "../../../action-form";
import { saveSeoAction } from "../../../cms-actions";
import { MediaPicker } from "../../../pickers";
import { Explain, Field, PageHeader, Panel, TextArea } from "../../../ui";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const [raw, media] = await Promise.all([getSettingRaw("seo"), listMedia()]);
  const seo = readSeo(raw);
  const library = media.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt }));

  return (
    <>
      <PageHeader title="Search & sharing" />

      <Explain>
        What Google shows in its results, and what appears when somebody pastes a link to this site
        into WhatsApp or Facebook. The old website had none of this — every page shared the same
        four-word title and had no description at all.
      </Explain>

      <div className="max-w-xl">
        <Panel title="Defaults">
          <div className="p-3">
            <ActionForm action={saveSeoAction} submitLabel="Save" variant="primary" size="md">
              <div className="space-y-4">
                <Field
                  label="Title"
                  name="default_title"
                  defaultValue={seo.default_title}
                  hint="Shown as the headline of a search result. Around 60 characters."
                />
                <TextArea
                  label="Description"
                  name="default_description"
                  rows={3}
                  defaultValue={seo.default_description}
                  hint="The grey paragraph under the headline. Around 155 characters."
                />
                <MediaPicker
                  name="og_media_id"
                  label="Sharing image"
                  hint="Shown when a link to the site is pasted into a chat. Wide, not square."
                  value={seo.og_media_id}
                  library={library}
                />
              </div>
            </ActionForm>
          </div>
        </Panel>
      </div>
    </>
  );
}
