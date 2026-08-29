import { readSite } from "@/lib/site-settings";
import { getSettingRaw } from "@/server/cms";
import { listMedia } from "@/server/admin-cms";
import { ActionForm } from "../../action-form";
import { saveSiteSettingsAction } from "../../cms-actions";
import { MediaPicker } from "../../pickers";
import { Check, Explain, Field, PageHeader, Panel, TextArea } from "../../ui";

export const dynamic = "force-dynamic";

/**
 * The organisation's own details, in one place.
 *
 * The email, phone and address here are the only copies anywhere — the header,
 * the footer and the contact page all read them from here, so they can never
 * disagree with each other the way three hardcoded copies eventually would.
 */
export default async function SiteSettingsPage() {
  const [raw, media] = await Promise.all([getSettingRaw("site"), listMedia()]);
  const site = readSite(raw);
  const library = media.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt }));

  return (
    <>
      <PageHeader title="Site details" />

      <Explain>
        The organisation&apos;s name, logo and contact details. These appear in the header, the
        footer and on the contact page — change them once here and they change everywhere.
      </Explain>

      <ActionForm action={saveSiteSettingsAction} submitLabel="Save" variant="primary" size="md">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Panel title="Identity">
            <div className="space-y-4 p-3">
              <Field label="Full name" name="org_name" defaultValue={site.org_name} required />
              <Field
                label="Short name"
                name="short_name"
                defaultValue={site.short_name}
                hint="Used in browser tabs, where the full name is too long."
              />
              <Field label="Tagline" name="tagline" defaultValue={site.tagline} />
              <MediaPicker name="logo_media_id" label="Logo" value={site.logo_media_id} library={library} />
              <MediaPicker
                name="favicon_media_id"
                label="Browser tab icon"
                hint="A small square image. The old site linked to one that no longer exists, so this starts empty."
                value={site.favicon_media_id}
                library={library}
              />
            </div>
          </Panel>

          <Panel title="How to reach us">
            <div className="space-y-4 p-3">
              <Field label="Email" name="email" type="email" defaultValue={site.email} />
              <Field label="Phone" name="phone" defaultValue={site.phone} placeholder="+91 9987444460" />
              <TextArea label="Address" name="address" rows={3} defaultValue={site.address} />
            </div>
          </Panel>

          <Panel title="Social">
            <div className="space-y-4 p-3">
              <Field
                label="Facebook"
                name="facebook"
                defaultValue={site.facebook}
                hint="Full address, or leave empty to hide the link."
              />
              <Field label="Instagram" name="instagram" defaultValue={site.instagram} />
              <Field label="YouTube" name="youtube" defaultValue={site.youtube} />
              <Field label="LinkedIn" name="linkedin" defaultValue={site.linkedin} />
            </div>
          </Panel>

          <Panel title="Footer and banner">
            <div className="space-y-4 p-3">
              <TextArea label="Footer paragraph" name="footer_blurb" rows={3} defaultValue={site.footer_blurb} />

              <div className="border-t border-rule pt-4">
                <Check
                  label="Show an announcement strip at the very top"
                  name="announcement_enabled"
                  defaultChecked={site.announcement.enabled}
                />
                <div className="mt-3 space-y-3">
                  <Field label="What it says" name="announcement_text" defaultValue={site.announcement.text} />
                  <Field
                    label="Where it links"
                    name="announcement_href"
                    defaultValue={site.announcement.href}
                    hint="Optional. Leave empty for plain text."
                  />
                </div>
              </div>

              <div className="border-t border-rule pt-4">
                <p className="spec mb-2 text-ink">The donate button</p>
                <div className="space-y-3">
                  <Field label="What it says" name="donate_label" defaultValue={site.donate.label} />
                  <Field label="Where it goes" name="donate_href" defaultValue={site.donate.href} />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </ActionForm>
    </>
  );
}
