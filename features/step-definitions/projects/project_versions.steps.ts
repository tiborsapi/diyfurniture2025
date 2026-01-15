import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';

Given('I am on the project list page', async function () {
  await this.page.goto('http://localhost:4200/project');
});

When('I click the "Edit" button for project {string}', async function (projectName: string) {
  // Finds the row containing the text and clicks the edit icon
  const row = this.page.locator('tr', { hasText: projectName });
  await row.locator('mat-icon:text("edit")').click();
});

When('I change the name to {string} and click "Save"', async function (newName: string) {
  const nameInput = this.page.locator('input[formControlName="name"]');
  await nameInput.fill(newName);
  await this.page.click('button:has-text("Save Changes")');
});

Then('I should see {string} in the list', async function (expectedName: string) {
  const listText = await this.page.locator('.custom-table').innerText();
  assert(listText.includes(expectedName), `Expected list to contain "${expectedName}", got "${listText}"`);
});

When('I click "Restore" on the first version in history', async function () {
  // Clicks the first "Restore" button found in the version table
  await this.page.locator('.version-table button:has-text("Restore")').first().click();
  // Handle the browser confirm() dialog
  this.page.on('dialog', (dialog: { accept: () => any; }) => dialog.accept());
});

Then('the project name should be reverted to {string}', async function (originalName: string) {
  const value = await this.page.locator('input[formControlName="name"]').inputValue();
  assert.strictEqual(value, originalName, `Expected input value "${originalName}", got "${value}"`);
});