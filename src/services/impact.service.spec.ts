import { ImpactService } from './impact.service';
import { ImpactRepository } from '../repositories/impact.repository';

describe('ImpactService', () => {
  const material = (materialType: string, co2: number, water: number) => ({
    materialType,
    estimatedCo2SavingsKG: co2,
    estimatedWaterSavingsLT: water,
    translations: [],
  });

  const make = (composition: unknown[], weights: unknown) =>
    new ImpactService({
      findProductComposition: jest.fn().mockResolvedValue(composition),
      findProductWeight: jest.fn().mockResolvedValue(weights),
    } as unknown as ImpactRepository);

  it('scales each material by its share of the product weight', async () => {
    const service = make(
      [
        {
          materialTypeId: 1,
          percentage: 80,
          material: material('COTTON', 5, 2000),
        },
        {
          materialTypeId: 2,
          percentage: 20,
          material: material('POLYESTER', 2, 100),
        },
      ],
      { weight: 500, weightUnit: 'G', storeSubCategory: null },
    );

    const impact = await service.calculateProductImpact(1);

    // 0.4 kg cotton (2 kg CO2, 800 L) + 0.1 kg polyester (0.2 kg CO2, 10 L)
    expect(impact).toMatchObject({
      totalCo2SavingsKG: 2.2,
      totalWaterSavingsLT: 810,
    });
    expect(impact!.materialBreakdown.map((m) => m.materialTypeLabel)).toEqual([
      'Cotton',
      'Polyester',
    ]);
  });

  it("falls back to the subcategory's average weight", async () => {
    const service = make(
      [
        {
          materialTypeId: 1,
          percentage: 100,
          material: material('GLASS', 1, 10),
        },
      ],
      {
        weight: null,
        weightUnit: null,
        storeSubCategory: { averageWeight: 2, weightUnit: 'KG' },
      },
    );
    await expect(service.calculateProductImpact(1)).resolves.toMatchObject({
      totalCo2SavingsKG: 2,
      totalWaterSavingsLT: 20,
    });
  });

  it('claims nothing for a product made only of unscored materials', async () => {
    const service = make(
      [
        {
          materialTypeId: 1,
          percentage: 100,
          material: material('FOOD', 0, 0),
        },
      ],
      { weight: 1, weightUnit: 'KG', storeSubCategory: null },
    );
    await expect(service.calculateProductImpact(1)).resolves.toBeNull();
  });

  it('claims nothing without a composition', async () => {
    await expect(make([], null).calculateProductImpact(1)).resolves.toBeNull();
  });
});
