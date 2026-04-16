import { Injectable } from '@nestjs/common';
import { Language } from '../../graphql/enums';

type TranslationParams = Record<string, string>;

type TranslationMap = Record<string, Record<Language, string>>;

const TRANSLATIONS: TranslationMap = {
  'errors.category_not_found': {
    [Language.ES]: "Categoría con slug '{slug}' no encontrada",
    [Language.EN]: "Category with slug '{slug}' not found",
    [Language.FR]: "Catégorie avec le slug '{slug}' introuvable",
    [Language.PT]: "Categoria com slug '{slug}' não encontrada",
    [Language.DE]: "Kategorie mit Slug '{slug}' nicht gefunden",
  },
  'errors.invalid_pagination': {
    [Language.ES]: 'Parámetros de paginación inválidos',
    [Language.EN]: 'Invalid pagination parameters',
    [Language.FR]: 'Paramètres de pagination invalides',
    [Language.PT]: 'Parâmetros de paginação inválidos',
    [Language.DE]: 'Ungültige Paginierungsparameter',
  },
  'errors.department_not_found': {
    [Language.ES]: "Departamento con slug '{slug}' no encontrado",
    [Language.EN]: "Department with slug '{slug}' not found",
    [Language.FR]: "Département avec le slug '{slug}' introuvable",
    [Language.PT]: "Departamento com slug '{slug}' não encontrado",
    [Language.DE]: "Abteilung mit Slug '{slug}' nicht gefunden",
  },
  'errors.limit_out_of_range': {
    [Language.ES]: 'El límite debe estar entre {min} y {max}',
    [Language.EN]: 'Limit must be between {min} and {max}',
    [Language.FR]: 'La limite doit être comprise entre {min} et {max}',
    [Language.PT]: 'O limite deve estar entre {min} e {max}',
    [Language.DE]: 'Der Grenzwert muss zwischen {min} und {max} liegen',
  },
  'errors.offset_negative': {
    [Language.ES]: 'El offset no puede ser negativo',
    [Language.EN]: 'Offset must be non-negative',
    [Language.FR]: "L'offset ne peut pas être négatif",
    [Language.PT]: 'O offset não pode ser negativo',
    [Language.DE]: 'Der Offset darf nicht negativ sein',
  },
  'errors.store_category_not_found': {
    [Language.ES]: "Categoría de tienda con slug '{slug}' no encontrada",
    [Language.EN]: "Store category with slug '{slug}' not found",
    [Language.FR]: "Catégorie de boutique avec le slug '{slug}' introuvable",
    [Language.PT]: "Categoria de loja com slug '{slug}' não encontrada",
    [Language.DE]: "Shop-Kategorie mit Slug '{slug}' nicht gefunden",
  },
  'errors.store_category_id_not_found': {
    [Language.ES]: "Categoría de tienda con ID '{id}' no encontrada",
    [Language.EN]: "Store category with ID '{id}' not found",
    [Language.FR]: "Catégorie de boutique avec l'ID '{id}' introuvable",
    [Language.PT]: "Categoria de loja com ID '{id}' não encontrada",
    [Language.DE]: "Shop-Kategorie mit ID '{id}' nicht gefunden",
  },
  'errors.store_subcategory_not_found': {
    [Language.ES]: "Subcategoría de tienda con slug '{slug}' no encontrada",
    [Language.EN]: "Store subcategory with slug '{slug}' not found",
    [Language.FR]:
      "Sous-catégorie de boutique avec le slug '{slug}' introuvable",
    [Language.PT]: "Subcategoria de loja com slug '{slug}' não encontrada",
    [Language.DE]: "Shop-Unterkategorie mit Slug '{slug}' nicht gefunden",
  },
  'errors.store_product_not_found': {
    [Language.ES]: "Producto de tienda con ID '{id}' no encontrado",
    [Language.EN]: "Store product with ID '{id}' not found",
    [Language.FR]: "Produit de boutique avec l'ID '{id}' introuvable",
    [Language.PT]: "Produto de loja com ID '{id}' não encontrado",
    [Language.DE]: "Shop-Produkt mit ID '{id}' nicht gefunden",
  },
  'errors.seller_auth_required': {
    [Language.ES]: 'Autenticación de vendedor requerida',
    [Language.EN]: 'Seller authentication required',
    [Language.FR]: 'Authentification du vendeur requise',
    [Language.PT]: 'Autenticação do vendedor necessária',
    [Language.DE]: 'Verkäufer-Authentifizierung erforderlich',
  },
  'errors.product_update_forbidden': {
    [Language.ES]: 'No tienes permiso para actualizar este producto',
    [Language.EN]: 'You do not have permission to update this product',
    [Language.FR]: "Vous n'avez pas la permission de mettre à jour ce produit",
    [Language.PT]: 'Você não tem permissão para atualizar este produto',
    [Language.DE]:
      'Sie haben keine Berechtigung, dieses Produkt zu aktualisieren',
  },
  'errors.product_delete_forbidden': {
    [Language.ES]: 'No tienes permiso para eliminar este producto',
    [Language.EN]: 'You do not have permission to delete this product',
    [Language.FR]: "Vous n'avez pas la permission de supprimer ce produit",
    [Language.PT]: 'Você não tem permissão para excluir este produto',
    [Language.DE]: 'Sie haben keine Berechtigung, dieses Produkt zu löschen',
  },
  'errors.product_modify_forbidden': {
    [Language.ES]: 'No tienes permiso para modificar este producto',
    [Language.EN]: 'You do not have permission to modify this product',
    [Language.FR]: "Vous n'avez pas la permission de modifier ce produit",
    [Language.PT]: 'Você não tem permissão para modificar este produto',
    [Language.DE]: 'Sie haben keine Berechtigung, dieses Produkt zu ändern',
  },
};

/**
 * I18N Service - Manages language context for multi-language support
 *
 * This service provides language context management for the application.
 * In a request-scoped architecture, language is extracted from headers
 * and made available throughout the request lifecycle.
 */
@Injectable()
export class I18nService {
  readonly DEFAULT_LANGUAGE = Language.ES;

  /**
   * Parses Accept-Language header and returns the best matching Language
   * Falls back to DEFAULT_LANGUAGE if no match is found
   *
   * @param {string | undefined} acceptLanguageHeader - The Accept-Language header value
   * @returns {Language} The matched language or default
   *
   * @example
   * parseAcceptLanguage('en-US,en;q=0.9,es;q=0.8') // returns Language.EN
   * parseAcceptLanguage('fr-FR') // returns Language.FR
   * parseAcceptLanguage('xx-XX') // returns Language.ES (default)
   */
  parseAcceptLanguage(acceptLanguageHeader: string | undefined): Language {
    if (!acceptLanguageHeader) {
      return this.DEFAULT_LANGUAGE;
    }

    // Parse the Accept-Language header
    // Format: "en-US,en;q=0.9,es;q=0.8,fr;q=0.7"
    const languages = acceptLanguageHeader
      .split(',')
      .map((lang) => {
        const [code, qStr] = lang.trim().split(';');
        const q = qStr ? parseFloat(qStr.split('=')[1]) : 1.0;
        return { code: code.split('-')[0].toUpperCase(), q };
      })
      .sort((a, b) => b.q - a.q);

    // Find the first matching language
    for (const { code } of languages) {
      if (Object.values(Language).includes(code as Language)) {
        return code as Language;
      }
    }

    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Gets the default language for fallback scenarios
   * @returns {Language} The default language
   */
  getDefaultLanguage(): Language {
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Translates a message key to the requested language.
   * Falls back to DEFAULT_LANGUAGE if the key is not found in the requested language.
   * Returns the key itself if not found in any language.
   *
   * Supports {{param}} interpolation in message strings.
   *
   * @param {string} key - Dot-notation message key (e.g. 'errors.not_found')
   * @param {Language} language - Target language
   * @param {Record<string, string>} [params] - Optional interpolation params
   * @returns {string} Translated and interpolated message
   */
  translate(
    key: string,
    language: Language,
    params?: TranslationParams,
  ): string {
    const entry = TRANSLATIONS[key];
    let message = entry?.[language] ?? entry?.[this.DEFAULT_LANGUAGE] ?? key;

    if (params) {
      for (const [param, value] of Object.entries(params)) {
        message = message.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
      }
    }

    return message;
  }
}
