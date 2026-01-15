Feature: Project Versioning and Restore

  @e2e
  Scenario: User updates a project and restores a previous version
    Given I am on the project list page
    When I click the "Edit" button for project "Old Project"
    And I change the name to "Updated Project" and click "Save"
    Then I should see "Updated Project" in the list
    When I click the "Edit" button for project "Updated Project"
    And I click "Restore" on the first version in history
    Then the project name should be reverted to "Old Project"