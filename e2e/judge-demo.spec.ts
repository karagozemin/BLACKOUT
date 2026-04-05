import { expect, test } from "@playwright/test";

test.describe("BLACKOUT judge demo flow", () => {
  test("mission-control renders and guided demo advances", async ({ page }) => {
    test.setTimeout(100_000);

    await page.goto("/mission-control");

    await expect(page.getByRole("heading", { name: /Leaderless Emergency Agent Economy/i })).toBeVisible();
    await expect(page.locator("header").getByText(/Deterministic seed/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Start Judge Demo/i }).click();

    await expect(page.getByText(/Step 1\/8: Peer discovery/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Stop Judge Demo/i })).toBeVisible();

    await expect(page.getByText(/Step 2\/8: Local negotiation/i)).toBeVisible({ timeout: 12_000 });

    await expect(page.getByText(/Step 3\/8: Node failure/i)).toBeVisible({ timeout: 22_000 });
    await expect(page.getByText(/Manual fault: agent .* forced offline/i)).toBeVisible({ timeout: 22_000 });
    await expect(page.getByText(/Step 4\/8: Failover recovery/i)).toBeVisible({ timeout: 22_000 });

    await expect(page.getByText(/Step 6\/8: Verifier rejection/i)).toBeVisible({ timeout: 22_000 });
    await expect(page.getByText(/Verifier reject/i)).toBeVisible({ timeout: 22_000 });

    await expect(page.getByText(/Step 7\/8: Proof before settlement/i)).toBeVisible({ timeout: 20_000 });

    await page.locator("header").getByRole("link", { name: "Mission Summary", exact: true }).click();

    await expect(page.getByRole("heading", { name: /Final Mission Snapshot & Replay/i })).toBeVisible();
    await expect(page.getByText(/No Mission Run Yet/i)).toHaveCount(0);
    await expect(page.getByText(/rejected/i).first()).toBeVisible();
  });

  test("direct summary visit shows clear guidance", async ({ page }) => {
    await page.goto("/mission-summary");
    await expect(page.getByText(/No Mission Run Yet/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Go Start Mission Control/i })).toBeVisible();
  });
});
