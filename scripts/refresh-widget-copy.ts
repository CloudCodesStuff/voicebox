/**
 * Re-apply current widget defaults to existing projects.
 *
 *   npm run refresh:widget
 *
 * Widget config is stored as JSON per project, so changing a default in code
 * doesn't touch rows that were created earlier. This backfills the new fields
 * (font, ratingStyle) and refreshes copy that was still on old wording, while
 * leaving anything a customer deliberately customised alone.
 */

import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { defaultWidgetConfig, parseWidgetConfig } from "../src/lib/widget-config";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const STALE_COPY = [
  "We read everything. It genuinely shapes what we build next.",
  "Thank you, this really helps.",
  "Thank you, this really helps",
];

db.project
  .findMany({ select: { id: true, name: true, widgetConfig: true } })
  .then(async (projects) => {
    let touched = 0;

    for (const project of projects) {
      const current = parseWidgetConfig(project.widgetConfig);

      const next = {
        ...current,
        // Fields that didn't exist when the row was written.
        font: current.font ?? defaultWidgetConfig.font,
        ratingStyle: current.ratingStyle ?? defaultWidgetConfig.ratingStyle,
        // Only move the colour if it's still sitting on the previous default,
        // which means nobody ever chose it. A deliberate brand colour is left
        // exactly where it is.
        accentColor:
          current.accentColor.toUpperCase() === "#5B4BFF"
            ? defaultWidgetConfig.accentColor
            : current.accentColor,
        // Only replace copy nobody has personalised.
        subheading: STALE_COPY.includes(current.subheading)
          ? defaultWidgetConfig.subheading
          : current.subheading,
        successMessage: STALE_COPY.includes(current.successMessage)
          ? defaultWidgetConfig.successMessage
          : current.successMessage,
      };

      if (JSON.stringify(next) !== JSON.stringify(current)) {
        await db.project.update({
          where: { id: project.id },
          data: { widgetConfig: next },
        });
        console.log(`  updated  ${project.name}`);
        touched++;
      }
    }

    console.log(`\n${touched} of ${projects.length} projects updated.\n`);
  })
  .finally(() => db.$disconnect());
