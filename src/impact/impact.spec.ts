import { Test, TestingModule } from '@nestjs/testing';
import { ImpactService } from './impact.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

describe('ImpactService', () => {
  let service: ImpactService;
  let prisma: PrismaService;

  const mockPrismaService = {
    materialImpactEstimate: {
      findMany: jest.fn(),
    },
    co2ImpactMessage: {
      findMany: jest.fn(),
    },
    waterImpactMessage: {
      findMany: jest.fn(),
    },
    productCategory: {
      findUnique: jest.fn(),
    },
    storeSubCategory: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ImpactService>(ImpactService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMaterialImpacts', () => {
    it('should return all material impacts', async () => {
      const mockMaterials = [
        {
          id: 1,
          materialType: 'Cotton',
          estimatedCo2SavingsKG: 5.2,
          estimatedWaterSavingsLT: 200,
        },
        {
          id: 2,
          materialType: 'Polyester',
          estimatedCo2SavingsKG: 3.8,
          estimatedWaterSavingsLT: 150,
        },
      ];

      mockPrismaService.materialImpactEstimate.findMany.mockResolvedValue(
        mockMaterials,
      );

      const result = await service.getMaterialImpacts();

      expect(result).toEqual(mockMaterials);
      expect(prisma.materialImpactEstimate.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          materialType: true,
          estimatedCo2SavingsKG: true,
          estimatedWaterSavingsLT: true,
        },
        orderBy: {
          materialType: 'asc',
        },
      });
    });

    it('should throw NotFoundError when no materials found', async () => {
      mockPrismaService.materialImpactEstimate.findMany.mockResolvedValue([]);

      await expect(service.getMaterialImpacts()).rejects.toThrow(NotFoundError);
      await expect(service.getMaterialImpacts()).rejects.toThrow(
        'No se encontraron materiales con datos de impacto.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.materialImpactEstimate.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getMaterialImpacts()).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getMaterialImpacts()).rejects.toThrow(
        'Error al obtener los datos de impacto de materiales',
      );
    });
  });

  describe('getAllCo2ImpactMessages', () => {
    it('should return all CO2 impact messages', async () => {
      const mockMessages = [
        {
          id: 1,
          min: 0,
          max: 10,
          message1: 'Low impact',
          message2: 'Keep going',
          message3: 'Great start',
        },
        {
          id: 2,
          min: 10,
          max: 50,
          message1: 'Medium impact',
          message2: 'Good work',
          message3: 'Nice progress',
        },
      ];

      mockPrismaService.co2ImpactMessage.findMany.mockResolvedValue(
        mockMessages,
      );

      const result = await service.getAllCo2ImpactMessages();

      expect(result).toEqual(mockMessages);
      expect(prisma.co2ImpactMessage.findMany).toHaveBeenCalledWith({
        orderBy: {
          min: 'asc',
        },
      });
    });

    it('should throw NotFoundError when no messages found', async () => {
      mockPrismaService.co2ImpactMessage.findMany.mockResolvedValue([]);

      await expect(service.getAllCo2ImpactMessages()).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getAllCo2ImpactMessages()).rejects.toThrow(
        'No se encontraron mensajes de impacto de CO2.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.co2ImpactMessage.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getAllCo2ImpactMessages()).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getAllWaterImpactMessages', () => {
    it('should return all water impact messages', async () => {
      const mockMessages = [
        {
          id: 1,
          min: 0,
          max: 100,
          message1: 'Low water savings',
          message2: 'Keep saving',
          message3: 'Good start',
        },
        {
          id: 2,
          min: 100,
          max: 500,
          message1: 'Medium water savings',
          message2: 'Great work',
          message3: 'Excellent progress',
        },
      ];

      mockPrismaService.waterImpactMessage.findMany.mockResolvedValue(
        mockMessages,
      );

      const result = await service.getAllWaterImpactMessages();

      expect(result).toEqual(mockMessages);
      expect(prisma.waterImpactMessage.findMany).toHaveBeenCalledWith({
        orderBy: {
          min: 'asc',
        },
      });
    });

    it('should throw NotFoundError when no messages found', async () => {
      mockPrismaService.waterImpactMessage.findMany.mockResolvedValue([]);

      await expect(service.getAllWaterImpactMessages()).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.getAllWaterImpactMessages()).rejects.toThrow(
        'No se encontraron mensajes de impacto de agua.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.waterImpactMessage.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getAllWaterImpactMessages()).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('calculateCategoryImpact', () => {
    it('should calculate impact for product category with materials', async () => {
      const mockCategory = {
        id: 1,
        productCategoryName: 'T-Shirts',
        averageWeight: 0.2,
        materials: [
          {
            id: 1,
            productCategoryId: 1,
            materialTypeId: 1,
            quantity: 80,
            unit: 'percentage',
            isPrimary: true,
            material: {
              id: 1,
              materialType: 'Cotton',
              estimatedCo2SavingsKG: 5.2,
              estimatedWaterSavingsLT: 200,
            },
          },
          {
            id: 2,
            productCategoryId: 1,
            materialTypeId: 2,
            quantity: 20,
            unit: 'percentage',
            isPrimary: false,
            material: {
              id: 2,
              materialType: 'Polyester',
              estimatedCo2SavingsKG: 3.8,
              estimatedWaterSavingsLT: 150,
            },
          },
        ],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        mockCategory,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result).toBeDefined();
      expect(result.totalCo2SavingsKG).toBeGreaterThan(0);
      expect(result.totalWaterSavingsLT).toBeGreaterThan(0);
      expect(result.materialBreakdown).toHaveLength(2);
      expect(result.materialBreakdown[0]).toHaveProperty('materialType');
      expect(result.materialBreakdown[0]).toHaveProperty('percentage');
      expect(result.materialBreakdown[0]).toHaveProperty('weightKG');
      expect(result.materialBreakdown[0]).toHaveProperty('co2SavingsKG');
      expect(result.materialBreakdown[0]).toHaveProperty('waterSavingsLT');

      // Cotton: 0.2kg * 80% = 0.16kg
      // CO2: 0.16 * 5.2 = 0.832
      // Water: 0.16 * 200 = 32
      // Polyester: 0.2kg * 20% = 0.04kg
      // CO2: 0.04 * 3.8 = 0.152
      // Water: 0.04 * 150 = 6
      // Total CO2: 0.984, Total Water: 38
      expect(result.totalCo2SavingsKG).toBeCloseTo(0.98, 1);
      expect(result.totalWaterSavingsLT).toBeCloseTo(38, 0);
    });

    it('should return zero impact when category has no materials', async () => {
      const mockCategory = {
        id: 1,
        productCategoryName: 'Empty Category',
        averageWeight: 0.5,
        materials: [],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        mockCategory,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result).toEqual({
        totalCo2SavingsKG: 0,
        totalWaterSavingsLT: 0,
        materialBreakdown: [],
      });
    });

    it('should handle materials with weight unit', async () => {
      const mockCategory = {
        id: 1,
        productCategoryName: 'Heavy Items',
        averageWeight: 1.0,
        materials: [
          {
            id: 1,
            productCategoryId: 1,
            materialTypeId: 1,
            quantity: 0.5,
            unit: 'kg',
            isPrimary: true,
            material: {
              id: 1,
              materialType: 'Steel',
              estimatedCo2SavingsKG: 2.5,
              estimatedWaterSavingsLT: 50,
            },
          },
        ],
      };

      mockPrismaService.productCategory.findUnique.mockResolvedValue(
        mockCategory,
      );

      const result = await service.calculateCategoryImpact(1);

      expect(result.totalCo2SavingsKG).toBeCloseTo(1.25, 2);
      expect(result.totalWaterSavingsLT).toBeCloseTo(25, 0);
    });

    it('should throw NotFoundError when category not found', async () => {
      mockPrismaService.productCategory.findUnique.mockResolvedValue(null);

      await expect(service.calculateCategoryImpact(999)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.calculateCategoryImpact(999)).rejects.toThrow(
        'Categoría de producto no encontrada.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.productCategory.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.calculateCategoryImpact(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('calculateSubcategoryImpact', () => {
    it('should calculate impact for store subcategory with materials', async () => {
      const mockSubcategory = {
        id: 1,
        subCategory: 'Upcycled Bags',
        materials: [
          {
            id: 1,
            storeSubcategoryId: 1,
            materialTypeId: 1,
            quantity: 70,
            unit: 'percentage',
            isPrimary: true,
            sourceMaterial: 'Car Tires',
            isRecycled: true,
            recycledPercentage: 100,
            material: {
              id: 1,
              materialType: 'Rubber',
              estimatedCo2SavingsKG: 4.5,
              estimatedWaterSavingsLT: 180,
            },
          },
          {
            id: 2,
            storeSubcategoryId: 1,
            materialTypeId: 2,
            quantity: 30,
            unit: 'percentage',
            isPrimary: false,
            sourceMaterial: 'Plastic Bottles',
            isRecycled: true,
            recycledPercentage: 100,
            material: {
              id: 2,
              materialType: 'Plastic',
              estimatedCo2SavingsKG: 3.2,
              estimatedWaterSavingsLT: 120,
            },
          },
        ],
      };

      mockPrismaService.storeSubCategory.findUnique.mockResolvedValue(
        mockSubcategory,
      );

      const result = await service.calculateSubcategoryImpact(1);

      expect(result).toBeDefined();
      expect(result.totalCo2SavingsKG).toBeGreaterThan(0);
      expect(result.totalWaterSavingsLT).toBeGreaterThan(0);
      expect(result.materialBreakdown).toHaveLength(2);
      expect(result.materialBreakdown[0]).toHaveProperty('materialType');
      expect(result.materialBreakdown[0]).toHaveProperty('sourceMaterial');
      expect(result.materialBreakdown[0]).toHaveProperty('percentage');
      expect(result.materialBreakdown[0]).toHaveProperty('recycledPercentage');
      expect(result.materialBreakdown[0]).toHaveProperty('isRecycled');

      // Rubber: 70% = 0.7kg
      // CO2: 0.7 * 4.5 = 3.15
      // Water: 0.7 * 180 = 126
      // Plastic: 30% = 0.3kg
      // CO2: 0.3 * 3.2 = 0.96
      // Water: 0.3 * 120 = 36
      // Total CO2: 4.11, Total Water: 162
      expect(result.totalCo2SavingsKG).toBeCloseTo(4.11, 1);
      expect(result.totalWaterSavingsLT).toBeCloseTo(162, 0);
    });

    it('should return zero impact when subcategory has no materials', async () => {
      const mockSubcategory = {
        id: 1,
        subCategory: 'Empty Subcategory',
        materials: [],
      };

      mockPrismaService.storeSubCategory.findUnique.mockResolvedValue(
        mockSubcategory,
      );

      const result = await service.calculateSubcategoryImpact(1);

      expect(result).toEqual({
        totalCo2SavingsKG: 0,
        totalWaterSavingsLT: 0,
        materialBreakdown: [],
      });
    });

    it('should handle materials with weight unit instead of percentage', async () => {
      const mockSubcategory = {
        id: 1,
        subCategory: 'Heavy Upcycled Items',
        materials: [
          {
            id: 1,
            storeSubcategoryId: 1,
            materialTypeId: 1,
            quantity: 2.5,
            unit: 'kg',
            isPrimary: true,
            sourceMaterial: 'Old Wood',
            isRecycled: true,
            recycledPercentage: 95,
            material: {
              id: 1,
              materialType: 'Wood',
              estimatedCo2SavingsKG: 1.8,
              estimatedWaterSavingsLT: 80,
            },
          },
        ],
      };

      mockPrismaService.storeSubCategory.findUnique.mockResolvedValue(
        mockSubcategory,
      );

      const result = await service.calculateSubcategoryImpact(1);

      // 2.5kg * 1.8 = 4.5 CO2
      // 2.5kg * 80 = 200 Water
      expect(result.totalCo2SavingsKG).toBeCloseTo(4.5, 1);
      expect(result.totalWaterSavingsLT).toBeCloseTo(200, 0);
      expect(result.materialBreakdown[0].percentage).toBeNull();
    });

    it('should throw NotFoundError when subcategory not found', async () => {
      mockPrismaService.storeSubCategory.findUnique.mockResolvedValue(null);

      await expect(service.calculateSubcategoryImpact(999)).rejects.toThrow(
        NotFoundError,
      );
      await expect(service.calculateSubcategoryImpact(999)).rejects.toThrow(
        'Subcategoría no encontrada.',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeSubCategory.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.calculateSubcategoryImpact(1)).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.calculateSubcategoryImpact(1)).rejects.toThrow(
        'Error al calcular el impacto ambiental',
      );
    });
  });
});
