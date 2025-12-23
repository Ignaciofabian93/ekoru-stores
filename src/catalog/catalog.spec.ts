import { Test, TestingModule } from '@nestjs/testing';
import { StoreCatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
} from '../common/exceptions/graphql.exceptions';

describe('StoreCatalogService', () => {
  let service: StoreCatalogService;

  const mockPrismaService = {
    storeCategory: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreCatalogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StoreCatalogService>(StoreCatalogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStoreCatalog', () => {
    it('should return store catalog successfully', async () => {
      const mockCatalog = [
        {
          id: 1,
          category: 'Electronics',
          href: '/electronics',
          subcategories: [
            { id: 1, subCategory: 'Phones' },
            { id: 2, subCategory: 'Laptops' },
          ],
        },
        {
          id: 2,
          category: 'Clothing',
          href: '/clothing',
          subcategories: [{ id: 3, subCategory: 'Shirts' }],
        },
      ];

      mockPrismaService.storeCategory.findMany.mockResolvedValue(mockCatalog);

      const result = await service.getStoreCatalog();

      expect(result).toEqual(mockCatalog);
      expect(mockPrismaService.storeCategory.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          category: true,
          href: true,
          subcategories: {
            select: {
              id: true,
              subCategory: true,
            },
          },
        },
        orderBy: {
          category: 'asc',
        },
      });
      expect(mockPrismaService.storeCategory.findMany).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when no categories are found', async () => {
      mockPrismaService.storeCategory.findMany.mockResolvedValue([]);

      await expect(service.getStoreCatalog()).rejects.toThrow(NotFoundError);
      await expect(service.getStoreCatalog()).rejects.toThrow(
        'No se encontraron categorías de tienda',
      );
    });

    it('should throw InternalServerError when database error occurs', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.storeCategory.findMany.mockRejectedValue(dbError);

      await expect(service.getStoreCatalog()).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getStoreCatalog()).rejects.toThrow(
        'Error al obtener el catálogo de tiendas',
      );
    });

    it('should re-throw NotFoundError if it occurs during query', async () => {
      const notFoundError = new NotFoundError('Custom not found error');
      mockPrismaService.storeCategory.findMany.mockRejectedValue(notFoundError);

      await expect(service.getStoreCatalog()).rejects.toThrow(NotFoundError);
      await expect(service.getStoreCatalog()).rejects.toThrow(
        'Custom not found error',
      );
    });

    it('should handle empty subcategories array', async () => {
      const mockCatalog = [
        {
          id: 1,
          category: 'New Category',
          href: '/new-category',
          subcategories: [],
        },
      ];

      mockPrismaService.storeCategory.findMany.mockResolvedValue(mockCatalog);

      const result = await service.getStoreCatalog();

      expect(result).toEqual(mockCatalog);
      expect(result[0].subcategories).toHaveLength(0);
    });
  });
});
