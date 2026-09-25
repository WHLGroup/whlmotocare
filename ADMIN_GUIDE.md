# WHL Motocare — catalogue administration

## First-time owner setup

Open the private owner setup link supplied with the website. It opens `/admin` and fills in the private setup key automatically. Choose your name, email address and a password of at least 12 characters, then select **Create owner account**.

The setup key is stored only in the server's `ADMIN_SETUP_KEY` environment variable. It is never included in public pages or client JavaScript. It cannot be used to create another owner once the owner account exists. Keep the private setup link to yourself.

If you open `/admin` directly before setup, enter the private setup key manually. There is no public account registration and no default admin password.

## Sign in

Use **Admin login** in the storefront footer, or visit `/admin`. Sign in using the email address and password you chose. Sign out when finished, especially on shared devices. Sessions expire after 12 hours.

## Add a product

1. Select **Add product**.
2. Enter the product name, category, description and price in whole Malawi kwacha (MK / MWK).
3. Select compatible motorcycle makes. Choose **Other** when appropriate.
4. Upload a JPG, PNG or WebP photo of up to 3 MB, or use the category illustration.
5. Leave **Visible in your shop** on to publish immediately, or turn it off to save a hidden product.
6. Optionally enable **Feature on the homepage**.
7. Select **Add product** to save.

The four most recently updated products that are both published and featured appear on the homepage. Uploaded photos are optimized and stored in PostgreSQL, so rebuilding or restarting the application does not remove them.

## Change a price or product

Click a price in the catalogue table for a quick price update, or select **Edit** to change all product details. New prices apply to new orders; existing order records retain their original item names and prices.

If another browser tab has updated the same product, saving is blocked rather than overwriting the newer changes. Close the form, select **Refresh**, and reopen the product.

## Hide or delete a product

Use the **Visibility** switch to hide an unavailable part while preserving its details. Hidden products are not shown in the shop and cannot be ordered.

The trash button permanently deletes a product after confirmation. Historical orders are retained unchanged. Hiding is usually the better option for temporarily unavailable stock.

## Catalogue tools

Search by part name, category or motorcycle make. Filter by category or published/hidden status. Larger catalogues have page controls. **View shop** opens the customer storefront in a new tab so you can check your updates.

## Server/operator notes

- Authentication and all catalogue mutations are checked on the server, not just hidden in the interface.
- Passwords are hashed with scrypt; session tokens are hashed in the database and sent only in HTTP-only cookies.
- Setup and sign-in attempts are rate-limited. Mutation requests require a matching browser origin.
- Uploaded files are size-limited, decoded, format-checked and re-encoded. SVG and animated uploads are rejected.
- Keep the PostgreSQL database backed up: it contains catalogue data, images, orders, bookings and admin accounts.
- In a fresh or reset environment, run `npm run bootstrap`. It applies the schema, seeds the starter catalogue only when the catalogue is empty, and generates a private `ADMIN_SETUP_KEY` only when one is missing. It is safe to run repeatedly and never overwrites existing data or keys. Restart the app afterwards so new environment values load.
- Against a hosted database, add `-- --print-key` so the generated key is printed for pasting into your host's environment variables instead of written to `.env`. See `DEPLOYMENT.md`.
- Run `node --experimental-strip-types scripts/admin-test.mjs` for admin regression tests. The tests use temporary accounts and products and remove only their own records.
