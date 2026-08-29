import { readNav } from "@/lib/site-settings";
import { getSettingRaw } from "@/server/cms";
import { ActionForm } from "../../../action-form";
import { saveNavAction } from "../../../cms-actions";
import { MenuEditor } from "../../../pickers";
import { Explain, PageHeader, Panel } from "../../../ui";

export const dynamic = "force-dynamic";

export default async function NavigationPage() {
  const nav = readNav(await getSettingRaw("nav"));

  return (
    <>
      <PageHeader title="Menu" />

      <Explain>
        The links across the top of every page, in the order they appear. The same list is repeated
        in the footer. Addresses start with a slash — <code>/about</code>, <code>/programs</code> —
        or with <code>https://</code> for somewhere else entirely.
      </Explain>

      <Panel title="Main menu">
        <div className="p-3">
          <ActionForm action={saveNavAction} submitLabel="Save menu" variant="primary" size="md">
            <MenuEditor value={nav.primary} />
          </ActionForm>
        </div>
      </Panel>
    </>
  );
}
