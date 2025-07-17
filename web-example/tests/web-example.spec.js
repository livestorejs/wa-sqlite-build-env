import { test, expect } from '@playwright/test';

test.describe('wa-sqlite + sqldiff-wasm Web Example', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the page with correct title and initial state', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('wa-sqlite + sqldiff-wasm Demo');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('wa-sqlite + sqldiff-wasm Demo');
    
    // Check initial state - only init button should be enabled
    await expect(page.locator('#init-btn')).toBeEnabled();
    await expect(page.locator('#create-db1-btn')).toBeDisabled();
    await expect(page.locator('#create-db2-btn')).toBeDisabled();
    
    // Check demo content is hidden initially
    await expect(page.locator('#demo-content')).toBeHidden();
  });

  test('should initialize libraries successfully', async ({ page }) => {
    // Click initialize button
    await page.click('#init-btn');
    
    // Wait for initialization to complete
    await expect(page.locator('#init-status')).toContainText('Both libraries initialized successfully!', { timeout: 15000 });
    
    // Check that demo content is now visible
    await expect(page.locator('#demo-content')).toBeVisible();
    
    // Check that database creation buttons are now enabled
    await expect(page.locator('#create-db1-btn')).toBeEnabled();
    await expect(page.locator('#create-db2-btn')).toBeEnabled();
  });

  test('should create both databases and run diff successfully', async ({ page }) => {
    // Initialize libraries first
    await page.click('#init-btn');
    await expect(page.locator('#init-status')).toContainText('Both libraries initialized successfully!', { timeout: 15000 });
    
    // Create database 1
    await page.click('#create-db1-btn');
    await expect(page.locator('#db1-output')).toContainText('Database 1 created successfully!', { timeout: 10000 });
    
    // Create database 2
    await page.click('#create-db2-btn');
    await expect(page.locator('#db2-output')).toContainText('Database 2 created successfully!', { timeout: 10000 });
    
    // Now diff buttons should be enabled
    await expect(page.locator('#run-diff-btn')).toBeEnabled();
    
    // Run basic diff
    await page.click('#run-diff-btn');
    
    // Wait for diff to complete and check output
    await expect(page.locator('#diff-output')).not.toContainText('Running basic diff...', { timeout: 10000 });
    
    // Check that diff output contains meaningful content
    const diffOutput = await page.locator('#diff-output').textContent();
    expect(diffOutput).not.toBe('-- No differences found --');
    expect(diffOutput).not.toBe('-- Run diff to see changes --');
    
    // Should contain SQL statements for the changes
    expect(diffOutput).toMatch(/(CREATE|ALTER|INSERT|UPDATE|DELETE)/i);
  });

  test('should validate sqldiff detects specific changes', async ({ page }) => {
    // Setup: Initialize and create both databases
    await page.click('#init-btn');
    await expect(page.locator('#init-status')).toContainText('Both libraries initialized successfully!', { timeout: 15000 });
    
    await page.click('#create-db1-btn');
    await expect(page.locator('#db1-output')).toContainText('Database 1 created successfully!', { timeout: 10000 });
    
    await page.click('#create-db2-btn');
    await expect(page.locator('#db2-output')).toContainText('Database 2 created successfully!', { timeout: 10000 });
    
    // Run schema diff to check for specific structural changes
    await page.click('#run-schema-btn');
    await expect(page.locator('#schema-output')).not.toContainText('Running schema diff...', { timeout: 10000 });
    
    const schemaOutput = await page.locator('#schema-output').textContent();
    
    // Should detect the new comments table
    expect(schemaOutput).toMatch(/CREATE TABLE.*comments/i);
    
    // Run basic diff to check for data changes
    await page.click('#run-diff-btn');
    await expect(page.locator('#diff-output')).not.toContainText('Running basic diff...', { timeout: 10000 });
    
    const diffOutput = await page.locator('#diff-output').textContent();
    
    // Should contain CREATE/DROP statements due to schema changes
    expect(diffOutput).toMatch(/(CREATE|DROP)/i);
    
    // Should detect the new comments table
    expect(diffOutput).toMatch(/CREATE TABLE.*comments/i);
    
    // Should detect the posts table recreation due to schema change
    expect(diffOutput).toMatch(/DROP TABLE.*posts/i);
  });
});
