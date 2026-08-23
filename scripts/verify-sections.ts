import connectDB from "../src/lib/db";
import { User } from "../src/models/User";
import { Section } from "../src/models/Section";
import { userService } from "../src/server/services/user.service";
import { sectionService } from "../src/server/services/section.service";
import { NotFoundError, ValidationError } from "../src/lib/errors";

async function runSectionVerification() {
  console.log("=========================================");
  console.log("  PHASE 2 SECTIONS CRUD & SECURITY TESTS ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    const conn = await connectDB();
    assert(conn.connection.readyState === 1, "MongoDB connected successfully");

    // Clean up test data
    const existingUsers = await User.find({ email: /test_section_.*@example.com/ });
    const existingIds = existingUsers.map((u) => u._id);
    await Section.deleteMany({ userId: { $in: existingIds } });
    await User.deleteMany({ _id: { $in: existingIds } });

    // 1. Create two test users
    console.log("\n--- 1. Setting Up Test Users ---");
    const userA = await userService.registerUser({
      name: "Clark Kent",
      email: "test_section_clark@example.com",
      password: "SuperPassword123!",
    });
    const userB = await userService.registerUser({
      name: "Lex Luthor",
      email: "test_section_lex@example.com",
      password: "EvilPassword123!",
    });
    assert(!!userA.id && !!userB.id, "Test Users Clark (A) and Lex (B) created");

    // 2. Create Sections for User A
    console.log("\n--- 2. Testing Section Creation ---");
    const section1 = await sectionService.createSection(userA.id, {
      name: "Daily Reporting",
      description: "Journalism and writing articles",
      color: "#0ea5e9",
    });
    assert(!!section1.id, "Section 1 created with ID", section1.id);
    assert(section1.name === "Daily Reporting", "Section 1 name saved correctly");
    assert(section1.color === "#0ea5e9", "Section 1 color saved correctly");
    assert(section1.order === 0, "Section 1 assigned order index 0");

    const section2 = await sectionService.createSection(userA.id, {
      name: "Metropolis Defense",
      description: "Keeping the city safe",
      color: "#f43f5e",
    });
    assert(section2.order === 1, "Section 2 assigned incremental order index 1");

    // 3. Validation Rules
    console.log("\n--- 3. Testing Section Validation ---");
    let validationFailed = false;
    try {
      await sectionService.createSection(userA.id, {
        name: "", // Empty name not allowed
      });
    } catch {
      validationFailed = true;
    }
    assert(validationFailed, "Empty section name rejected by schema validator");

    // 4. Retrieve Sections for User A
    console.log("\n--- 4. Testing Section Listing ---");
    const clarkSections = await sectionService.getSections(userA.id);
    assert(clarkSections.length === 2, "User A retrieves exactly 2 sections");
    assert(clarkSections[0].name === "Daily Reporting", "Sections returned in correct order");

    // 5. Update / Rename Section
    console.log("\n--- 5. Testing Section Renaming & Updating ---");
    const updatedSection = await sectionService.updateSection(section1.id, userA.id, {
      name: "Planet Journalism",
      description: "Updated description for Daily Planet work",
      color: "#10b981",
    });
    assert(updatedSection.name === "Planet Journalism", "Section successfully renamed");
    assert(updatedSection.color === "#10b981", "Section color updated to Emerald");
    assert(updatedSection.description === "Updated description for Daily Planet work", "Section description updated");

    // 6. Multi-Tenant Security & Isolation
    console.log("\n--- 6. Testing Multi-Tenant Data Isolation ---");
    // Lex (User B) attempts to read Clark's section
    const unauthorizedRead = await sectionService.getSectionById(section1.id, userB.id);
    assert(unauthorizedRead === null, "User B cannot read User A's section (returns null)");

    // Lex (User B) lists their own sections
    const lexSections = await sectionService.getSections(userB.id);
    assert(lexSections.length === 0, "User B has 0 sections (no leakage from User A)");

    // Lex (User B) attempts to update Clark's section
    let unauthorizedUpdateFailed = false;
    try {
      await sectionService.updateSection(section1.id, userB.id, {
        name: "Hacked by Lex",
      });
    } catch (err) {
      if (err instanceof NotFoundError) {
        unauthorizedUpdateFailed = true;
      }
    }
    assert(unauthorizedUpdateFailed, "User B cannot update User A's section (throws NotFoundError)");

    // Verify section name is untouched
    const verifiedSection = await sectionService.getSectionById(section1.id, userA.id);
    assert(verifiedSection?.name === "Planet Journalism", "Section name remains untouched by unauthorized update");

    // Lex (User B) attempts to delete Clark's section
    let unauthorizedDeleteFailed = false;
    try {
      await sectionService.deleteSection(section1.id, userB.id);
    } catch (err) {
      if (err instanceof NotFoundError) {
        unauthorizedDeleteFailed = true;
      }
    }
    assert(unauthorizedDeleteFailed, "User B cannot delete User A's section (throws NotFoundError)");

    // 7. Section Deletion by Owner
    console.log("\n--- 7. Testing Section Deletion by Owner ---");
    const deleteResult = await sectionService.deleteSection(section1.id, userA.id);
    assert(deleteResult === true, "Owner successfully deletes section");

    const deletedLookup = await sectionService.getSectionById(section1.id, userA.id);
    assert(deletedLookup === null, "Deleted section no longer exists");

    const remainingSections = await sectionService.getSections(userA.id);
    assert(remainingSections.length === 1, "User A now has 1 remaining section");

    // Cleanup
    await Section.deleteMany({ userId: { $in: [userA.id, userB.id] } });
    await User.deleteMany({ _id: { $in: [userA.id, userB.id] } });
    await conn.disconnect();

    console.log("\n=========================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with error:", error);
    process.exit(1);
  }
}

runSectionVerification();
