#!/usr/bin/env node

import { createClient } from '@sanity/client';

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/update-mls-agent-ids-rc.mjs <SANITY_TOKEN>');
  process.exit(1);
}

const client = createClient({
  projectId: 'nnkvnzkx',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

const agentIdMap = new Map([
  ['Alejandro Romero', '3427'],
  ['Amanda Pomeroy', '3279'],
  ['Amy Mace', '1347'],
  ['Ashley McCue', '3494'],
  ['Ashley Surbella', '4787'],
  ['Carol Fuller', '515'],
  ['Chris Manolopoulos', '401'],
  ['Christin Kolzig', '4326'],
  ['Christina Kliphardt', '3596'],
  ['Christopher Linck', '1966'],
  ['Dale Hash', '3212'],
  ['Dave Larson', '158'],
  ['Dawn Ellsworth', '403'],
  ['Emma McCord', '5531'],
  ['Eric Culverhouse', '39'],
  ['George Dress', '5430'],
  ['George Eakin', '727'],
  ['Ginger Jenks', '3007'],
  ['Greg Johnston', '513'],
  ['Jane Beyer', '476'],
  ['Jared Retter', '673'],
  ['Jason Barrow', '551'],
  ['Jeff Pomeroy', '4023'],
  ['Jenifer Siever', '4335'],
  ['Jim Hammond', '1350'],
  ['John Mower', '498'],
  ['Julie Lynch', '1928'],
  ['Karla Palmer', '749'],
  ['Katrina Brown', '5759'],
  ['Keeley Wagner', '1333'],
  ['Keith Silliman', '5837'],
  ['Kelly Haskins', '1448'],
  ['Ken Olsen', '3266'],
  ['Kendra Sadler', '4786'],
  ['Kristin Sweesy', '4221'],
  ['Kurt Nyce', '5851'],
  ['Lamar Linde', '4127'],
  ['Leslie Retter', '1244'],
  ['Linda Mcclelland', '880'],
  ['Linda Proctor', '206'],
  ['Linda Robinson', '867'],
  ['Linde Thomas', '3493'],
  ['Liz Bragg', '2846'],
  ['Lola Franklin', '5755'],
  ['Mark Trout', '127'],
  ['Marlee Pettit', '5877'],
  ['Martha Robles', '4736'],
  ['Michael Punch', '565'],
  ['Michael Thomas', '2889'],
  ['Michelle Wilson', '3909'],
  ['Mike Robinson', '212'],
  ['Misty Hendrickson', '5724'],
  ['Monica Brown', '1051'],
  ['Monroe Davis', '3267'],
  ['Rachael Brown', '5771'],
  ['Reece Hamm', '1002'],
  ['Ruby Balaggan', '4998'],
  ['Sally Ashby', '93'],
  ['Sally Jo Freund', '935'],
  ['Sandra Senger', '464'],
  ['Shaye Culbertson', '5966'],
  ['Silvia Idrovo', '2938'],
  ['Stephanie Garcia', '3831'],
  ['Stephanie Turner', '359'],
  ['Steve Coghill', '3451'],
  ['Sue Rhoads', '210'],
  ['Teresa Loftus-Culverhoue', '414'],
  ['Terra Nyce', '4807'],
  ['Terri Allender', '92'],
  ['Tina Morales', '1136'],
  ['Wayne Langford', '453'],
  ['Zara Ramonova', '368'],
]);

async function main() {
  const members = await client.fetch(
    `*[_type == "teamMember"]{ _id, name, mlsAgentId }`
  );
  console.log(`Found ${members.length} team members in Sanity (nnkvnzkx)\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [agentName, mlsId] of agentIdMap) {
    let member = members.find((m) => m.name === agentName);
    if (!member) {
      member = members.find(
        (m) => m.name && m.name.toLowerCase() === agentName.toLowerCase()
      );
    }

    if (!member) {
      console.log(`  NOT FOUND: ${agentName} (MLS ID: ${mlsId})`);
      notFound++;
      continue;
    }

    if (member.mlsAgentId === mlsId) {
      skipped++;
      continue;
    }

    const prev = member.mlsAgentId || '(none)';
    await client.patch(member._id).set({ mlsAgentId: mlsId }).commit();
    console.log(`  UPDATED: ${member.name} — ${prev} → ${mlsId}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Already correct: ${skipped}, Not found: ${notFound}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
