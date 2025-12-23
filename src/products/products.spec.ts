import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundError,
  InternalServerError,
  UnAuthorizedError,
} from '../common/exceptions/graphql.exceptions';
import { Badge, ProductSortField, SortOrder } from '../graphql/enums';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockStoreProduct = {
    id: 1,
    name: 'Upcycled Bag',
    description: 'Made from recycled tires',
    stock: 10,
    barcode: '123456789',
    sku: 'UB-001',
    price: 5000,
    hasOffer: false,
    offerPrice: null,
    sellerId: 'seller-123',
    createdAt: new Date('2025-01-01'),
    images: ['image1.jpg', 'image2.jpg'],
    isActive: true,
    updatedAt: new Date('2025-01-01'),
    badges: [Badge.SUSTAINABLE],
    brand: 'EcoStore',
    color: 'Black',
    ratingCount: 5,
    ratings: 4.5,
    reviewsNumber: 5,
    materialComposition: 'Recycled rubber',
    recycledContent: 100,
    subcategoryId: 1,
    deletedAt: null,
    sustainabilityScore: 95,
    carbonFootprint: 2.5,
    storeSubCategory: {
      id: 1,
      subCategory: 'Bags',
      storeCategoryId: 1,
      storeCategory: {
        id: 1,
        category: 'Fashion',
      },
      materials: [],
    },
    productVariant: [],
    seller: {
      id: 'seller-123',
      email: 'seller@test.com',
      sellerType: 'COMPANY',
      isActive: true,
      isVerified: true,
    },
  };

  const mockPrismaService = {
    storeProduct: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockProducts = [mockStoreProduct];
      mockPrismaService.storeProduct.count.mockResolvedValue(1);
      mockPrismaService.storeProduct.findMany.mockResolvedValue(mockProducts);

      const result = await service.getProducts(1, 10);

      expect(result).toBeDefined();
      expect(result.nodes).toEqual(mockProducts);
      expect(result.pageInfo.totalCount).toBe(1);
      expect(prisma.storeProduct.count).toHaveBeenCalled();
      expect(prisma.storeProduct.findMany).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      mockPrismaService.storeProduct.count.mockResolvedValue(0);
      mockPrismaService.storeProduct.findMany.mockResolvedValue([]);

      await service.getProducts(1, 10, {
        name: 'Bag',
        minPrice: 1000,
        maxPrice: 10000,
        isActive: true,
        sellerId: 'seller-123',
      });

      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Bag', mode: 'insensitive' },
            price: { gte: 1000, lte: 10000 },
            isActive: true,
            sellerId: 'seller-123',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should apply sorting correctly', async () => {
      mockPrismaService.storeProduct.count.mockResolvedValue(0);
      mockPrismaService.storeProduct.findMany.mockResolvedValue([]);

      await service.getProducts(1, 10, undefined, {
        field: ProductSortField.PRICE,
        order: SortOrder.ASC,
      });

      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        }),
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.count.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getProducts()).rejects.toThrow(InternalServerError);
      await expect(service.getProducts()).rejects.toThrow(
        'Error al obtener los productos',
      );
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue(
        mockStoreProduct,
      );

      const result = await service.getProductById(1);

      expect(result).toEqual(mockStoreProduct);
      expect(prisma.storeProduct.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue(null);

      await expect(service.getProductById(999)).rejects.toThrow(NotFoundError);
      await expect(service.getProductById(999)).rejects.toThrow(
        'Producto no encontrado',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getProductById(1)).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getProductsBySeller', () => {
    it('should return products for a specific seller', async () => {
      const mockProducts = [mockStoreProduct];
      mockPrismaService.storeProduct.count.mockResolvedValue(1);
      mockPrismaService.storeProduct.findMany.mockResolvedValue(mockProducts);

      const result = await service.getProductsBySeller('seller-123', 1, 10);

      expect(result.nodes).toEqual(mockProducts);
      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: 'seller-123',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should apply additional filters with sellerId', async () => {
      mockPrismaService.storeProduct.count.mockResolvedValue(0);
      mockPrismaService.storeProduct.findMany.mockResolvedValue([]);

      await service.getProductsBySeller('seller-123', 1, 10, {
        isActive: true,
        minPrice: 1000,
      });

      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sellerId: 'seller-123',
            isActive: true,
            price: { gte: 1000 },
          }),
        }),
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.count.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getProductsBySeller('seller-123')).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('getProductsBySubcategory', () => {
    it('should return products for a specific subcategory', async () => {
      const mockProducts = [mockStoreProduct];
      mockPrismaService.storeProduct.count.mockResolvedValue(1);
      mockPrismaService.storeProduct.findMany.mockResolvedValue(mockProducts);

      const result = await service.getProductsBySubcategory(1, 1, 10);

      expect(result.nodes).toEqual(mockProducts);
      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            subcategoryId: 1,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.count.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getProductsBySubcategory(1)).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.getProductsBySubcategory(1)).rejects.toThrow(
        'Error al obtener los productos por subcategoría',
      );
    });
  });

  describe('getProductsOnOffer', () => {
    it('should return only active products with offers', async () => {
      const mockProducts = [{ ...mockStoreProduct, hasOffer: true }];
      mockPrismaService.storeProduct.count.mockResolvedValue(1);
      mockPrismaService.storeProduct.findMany.mockResolvedValue(mockProducts);

      const result = await service.getProductsOnOffer(1, 10);

      expect(result.nodes).toEqual(mockProducts);
      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hasOffer: true,
            isActive: true,
            deletedAt: null,
          }),
        }),
      );
    });

    it('should apply additional filters with offer constraint', async () => {
      mockPrismaService.storeProduct.count.mockResolvedValue(0);
      mockPrismaService.storeProduct.findMany.mockResolvedValue([]);

      await service.getProductsOnOffer(1, 10, { minPrice: 2000 });

      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hasOffer: true,
            isActive: true,
            price: { gte: 2000 },
          }),
        }),
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.count.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.getProductsOnOffer()).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('addProduct', () => {
    const mockInput = {
      name: 'New Product',
      description: 'Test product',
      stock: 5,
      price: 3000,
      images: ['image.jpg'],
      subcategoryId: 1,
    };

    it('should create a new product', async () => {
      mockPrismaService.storeProduct.create.mockResolvedValue(mockStoreProduct);

      const result = await service.addProduct(mockInput, 'seller-123');

      expect(result).toEqual(mockStoreProduct);
      expect(prisma.storeProduct.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...mockInput,
          sellerId: 'seller-123',
          updatedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw UnAuthorizedError when sellerId is not provided', async () => {
      await expect(service.addProduct(mockInput)).rejects.toThrow(
        UnAuthorizedError,
      );
      await expect(service.addProduct(mockInput)).rejects.toThrow(
        'No autorizado',
      );
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.addProduct(mockInput, 'seller-123')).rejects.toThrow(
        InternalServerError,
      );
    });
  });

  describe('updateProduct', () => {
    const mockInput = {
      id: '1',
      name: 'Updated Product',
      price: 4000,
    };

    it('should update an existing product', async () => {
      const updatedProduct = { ...mockStoreProduct, name: 'Updated Product' };
      mockPrismaService.storeProduct.findUnique.mockResolvedValue({
        sellerId: 'seller-123',
      });
      mockPrismaService.storeProduct.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(mockInput, 'seller-123');

      expect(result).toEqual(updatedProduct);
      expect(prisma.storeProduct.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          name: 'Updated Product',
          price: 4000,
          updatedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw UnAuthorizedError when sellerId is not provided', async () => {
      await expect(service.updateProduct(mockInput)).rejects.toThrow(
        UnAuthorizedError,
      );
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProduct(mockInput, 'seller-123'),
      ).rejects.toThrow(NotFoundError);
      await expect(
        service.updateProduct(mockInput, 'seller-123'),
      ).rejects.toThrow('Producto no encontrado');
    });

    it('should throw UnAuthorizedError when seller does not own the product', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue({
        sellerId: 'other-seller',
      });

      await expect(
        service.updateProduct(mockInput, 'seller-123'),
      ).rejects.toThrow(UnAuthorizedError);
      await expect(
        service.updateProduct(mockInput, 'seller-123'),
      ).rejects.toThrow('No tienes permiso para editar este producto');
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue({
        sellerId: 'seller-123',
      });
      mockPrismaService.storeProduct.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateProduct(mockInput, 'seller-123'),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      const deletedProduct = { ...mockStoreProduct, deletedAt: new Date() };
      mockPrismaService.storeProduct.update.mockResolvedValue(deletedProduct);

      const result = await service.deleteProduct(1);

      expect(result).toEqual(deletedProduct);
      expect(prisma.storeProduct.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.deleteProduct(1)).rejects.toThrow(
        InternalServerError,
      );
      await expect(service.deleteProduct(1)).rejects.toThrow(
        'Error al eliminar el producto',
      );
    });
  });

  describe('toggleProductActive', () => {
    it('should toggle product active status from true to false', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue({
        sellerId: 'seller-123',
        isActive: true,
      });
      const toggledProduct = { ...mockStoreProduct, isActive: false };
      mockPrismaService.storeProduct.update.mockResolvedValue(toggledProduct);

      const result = await service.toggleProductActive(1, 'seller-123');

      expect(result).toEqual(toggledProduct);
      expect(prisma.storeProduct.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          isActive: false,
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should toggle product active status from false to true', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue({
        sellerId: 'seller-123',
        isActive: false,
      });
      const toggledProduct = { ...mockStoreProduct, isActive: true };
      mockPrismaService.storeProduct.update.mockResolvedValue(toggledProduct);

      const result = await service.toggleProductActive(1, 'seller-123');

      expect(result.isActive).toBe(true);
    });

    it('should throw UnAuthorizedError when sellerId is not provided', async () => {
      await expect(service.toggleProductActive(1)).rejects.toThrow(
        UnAuthorizedError,
      );
    });

    it('should throw NotFoundError when product does not exist', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleProductActive(1, 'seller-123'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw UnAuthorizedError when seller does not own the product', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue({
        sellerId: 'other-seller',
        isActive: true,
      });

      await expect(
        service.toggleProductActive(1, 'seller-123'),
      ).rejects.toThrow(UnAuthorizedError);
      await expect(
        service.toggleProductActive(1, 'seller-123'),
      ).rejects.toThrow('No tienes permiso para modificar este producto');
    });

    it('should throw InternalServerError on database error', async () => {
      mockPrismaService.storeProduct.findUnique.mockResolvedValue({
        sellerId: 'seller-123',
        isActive: true,
      });
      mockPrismaService.storeProduct.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.toggleProductActive(1, 'seller-123'),
      ).rejects.toThrow(InternalServerError);
    });
  });

  describe('buildProductWhereClause', () => {
    it('should build where clause with all filter options', async () => {
      mockPrismaService.storeProduct.count.mockResolvedValue(0);
      mockPrismaService.storeProduct.findMany.mockResolvedValue([]);

      await service.getProducts(1, 10, {
        name: 'Bag',
        minPrice: 1000,
        maxPrice: 5000,
        isActive: true,
        sellerId: 'seller-123',
        subcategoryId: 1,
        storeCategoryId: 2,
        brand: 'EcoStore',
        color: 'Black',
        badges: [Badge.SUSTAINABLE],
        hasOffer: true,
        minStock: 5,
        minRating: 4.0,
        minRecycledContent: 50,
        minSustainabilityScore: 80,
      });

      expect(prisma.storeProduct.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Bag', mode: 'insensitive' },
            price: { gte: 1000, lte: 5000 },
            isActive: true,
            sellerId: 'seller-123',
            subcategoryId: 1,
            storeSubCategory: { storeCategoryId: 2 },
            brand: { contains: 'EcoStore', mode: 'insensitive' },
            color: { contains: 'Black', mode: 'insensitive' },
            badges: { hasSome: [Badge.SUSTAINABLE] },
            hasOffer: true,
            stock: { gte: 5 },
            ratings: { gte: 4.0 },
            recycledContent: { gte: 50 },
            sustainabilityScore: { gte: 80 },
            deletedAt: null,
          }),
        }),
      );
    });
  });
});
