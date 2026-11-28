// Låneforespørsel og gis bort (#186a). Mockup godkjent av Max 20.10. Produksjonsbygget; testbrukeren ber om annonser
// som selgeren «E2E Selger» eier, og har ingen forespørsler fra før (global-setup rydder dem).
import { expect, test } from "@playwright/test";
import { dayFromNow, period } from "./dates";
import { AUTH_FILE } from "./global-setup";

test.use({ storageState: AUTH_FILE });

// 8 dager, og 4 dager for perioden som er for kort.
const START = dayFromNow(14);
const END = dayFromNow(21);
const SHORT_START = dayFromNow(30);
const SHORT_END = dayFromNow(33);

test("sende en låneforespørsel: summen vises mens man skriver, og forespørselen finnes etterpå", async ({ page }) => {
  await page.goto("/listings/e2e-lan", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Send låneforespørsel" }).click();

  await expect(page).toHaveURL(/\/listings\/e2e-lan\/loan$/);
  await expect(page.getByRole("heading", { name: "Send låneforespørsel" })).toBeVisible();
  await expect(page.getByText("Antall dager")).toHaveCount(0);

  await page.getByLabel("Fra").fill(START);
  await page.getByLabel("Til").fill(END);
  await expect(page.getByText("Antall dager")).toBeVisible();
  await expect(page.getByText("8", { exact: true })).toBeVisible();
  // 60 kr/uke / 7 * 8 dager = 68,57, rundet opp.
  await expect(page.getByText("69 kr", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Send forespørsel" }).click();

  await expect(page).toHaveURL(/\/listings\/e2e-lan$/);
  await expect(page.getByRole("link", { name: `Din forespørsel: ${period(START, END)}` })).toBeVisible();
  await expect(page.getByRole("link", { name: "Send låneforespørsel" })).toHaveCount(0);

  await page.getByRole("link", { name: `Din forespørsel: ${period(START, END)}` }).click();
  await expect(page).toHaveURL(/\/requests\/[\w-]+$/);
  await expect(page.getByText("Venter på svar fra E2E Selger")).toBeVisible();
  await expect(page.getByText(period(START, END), { exact: true })).toBeVisible();
  await expect(page.getByText("69 kr", { exact: true })).toBeVisible();

  // Lånesiden sender en som allerede har sendt tilbake til annonsen.
  await page.goto("/listings/e2e-lan/loan");
  await expect(page).toHaveURL(/\/listings\/e2e-lan$/);
});

test("en for kort periode viser feilen under feltet, beholder datoene og lagrer ingenting", async ({ page }) => {
  await page.goto("/listings/e2e-lan-feil/loan", { waitUntil: "networkidle" });
  await page.getByLabel("Fra").fill(SHORT_START);
  await page.getByLabel("Til").fill(SHORT_END);
  await page.getByRole("button", { name: "Send forespørsel" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Lånet må vare minst én uke" })).toBeVisible();
  await expect(page).toHaveURL(/\/listings\/e2e-lan-feil\/loan$/);
  await expect(page.getByLabel("Fra")).toHaveValue(SHORT_START);
  await expect(page.getByLabel("Til")).toHaveValue(SHORT_END);

  await page.goto("/listings/e2e-lan-feil", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Send låneforespørsel" })).toBeVisible();
});

test("gis bort: «Send forespørsel» sender uten felt, og knappen blir en lenke til forespørselen", async ({ page }) => {
  await page.goto("/listings/e2e-gis", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Send forespørsel" }).click();

  await expect(page.getByRole("link", { name: "Din forespørsel sendt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send forespørsel" })).toHaveCount(0);

  await page.getByRole("link", { name: "Din forespørsel sendt" }).click();
  await expect(page).toHaveURL(/\/requests\/[\w-]+$/);
  await expect(page.getByText("Venter på svar fra E2E Selger")).toBeVisible();
});

// Endret 24.10 (#229, AK-50): eieren ser «Administrer» i stedet for den grå knappen.
test("på din egen annonse står «Administrer» i stedet for knappen", async ({ page }) => {
  await page.goto("/listings/e2e-hammock", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Administrer" })).toHaveAttribute("href", "/listings/e2e-hammock/edit");
  await expect(page.getByText("Send låneforespørsel")).toHaveCount(0);

  await page.goto("/listings/e2e-hammock/loan");
  await expect(page).toHaveURL(/\/listings\/e2e-hammock$/);
});
