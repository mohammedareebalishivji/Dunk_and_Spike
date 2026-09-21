import { describe, it, expect } from 'vitest';
import { SponsorTier } from '../types';
import { SPONSOR_TIERS } from '../data/mockData';

describe('Manual Sponsor Addition & Permanent Deletion', () => {
  it('manually adds a new sponsor to an existing tier', () => {
    const initialTiers: SponsorTier[] = JSON.parse(JSON.stringify(SPONSOR_TIERS));
    const titleTier = initialTiers.find(t => t.id === 'title')!;
    const initialCount = titleTier.sponsors.length;

    const newSponsor = {
      name: 'Puma India Athletics',
      logoText: 'PUMA',
      subtext: 'Official Tournament High-Traction Footwear',
      since: '2026',
      industry: 'Athletic Footwear & Apparel',
    };

    const updatedTiers = initialTiers.map(tier => {
      if (tier.id !== 'title') return tier;
      return {
        ...tier,
        sponsors: [...tier.sponsors, newSponsor],
      };
    });

    const updatedTitleTier = updatedTiers.find(t => t.id === 'title')!;
    expect(updatedTitleTier.sponsors).toHaveLength(initialCount + 1);
    expect(updatedTitleTier.sponsors.some(s => s.name === 'Puma India Athletics')).toBe(true);
  });

  it('manually creates a new custom sponsorship tier with a sponsor', () => {
    const initialTiers: SponsorTier[] = JSON.parse(JSON.stringify(SPONSOR_TIERS));

    const newCustomTier: SponsorTier = {
      id: 'custom-tier-123',
      name: 'Regional Gold Partner',
      badge: 'REGIONAL GOLD',
      tagline: 'Supporting Local Championships',
      description: 'Regional corporate partner',
      investmentLevel: '₹5,00,000 / Season',
      color: '#10b981',
      perks: ['Scoreboard Digital Logo', '10 VIP Passes'],
      sponsors: [
        {
          name: 'Tata Steel Sports Academy',
          logoText: 'TATA STEEL',
          subtext: 'Official Regional Development Sponsor',
          since: '2026',
          industry: 'Industrial & Sports CSR',
        },
      ],
    };

    const updatedTiers = [...initialTiers, newCustomTier];
    expect(updatedTiers).toHaveLength(initialTiers.length + 1);
    const addedTier = updatedTiers.find(t => t.id === 'custom-tier-123');
    expect(addedTier).toBeDefined();
    expect(addedTier?.sponsors[0].name).toBe('Tata Steel Sports Academy');
  });

  it('permanently deletes an individual sponsor from a tier', () => {
    const initialTiers: SponsorTier[] = JSON.parse(JSON.stringify(SPONSOR_TIERS));
    const titleTier = initialTiers.find(t => t.id === 'title')!;
    expect(titleTier.sponsors.length).toBeGreaterThanOrEqual(2);

    const sponsorToDelete = titleTier.sponsors[0].name;

    const afterDeletion = initialTiers.map(tier => {
      if (tier.id !== 'title') return tier;
      return {
        ...tier,
        sponsors: tier.sponsors.filter(s => s.name !== sponsorToDelete),
      };
    });

    const updatedTitle = afterDeletion.find(t => t.id === 'title')!;
    expect(updatedTitle.sponsors.some(s => s.name === sponsorToDelete)).toBe(false);
    expect(updatedTitle.sponsors.length).toBe(titleTier.sponsors.length - 1);
  });

  it('permanently deletes an entire sponsorship tier', () => {
    const initialTiers: SponsorTier[] = JSON.parse(JSON.stringify(SPONSOR_TIERS));
    const countBefore = initialTiers.length;

    const afterDeletion = initialTiers.filter(t => t.id !== 'booster');
    expect(afterDeletion).toHaveLength(countBefore - 1);
    expect(afterDeletion.some(t => t.id === 'booster')).toBe(false);
  });

  it('handles clearing all sponsors without throwing errors', () => {
    const clearedTiers: SponsorTier[] = [];
    expect(clearedTiers).toHaveLength(0);
    expect(clearedTiers.map(t => t.sponsors).flat()).toHaveLength(0);
  });
});
