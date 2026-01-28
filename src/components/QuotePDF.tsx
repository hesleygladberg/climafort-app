import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Quote, Company } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  quoteTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  quoteNumber: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
  },
  quoteDate: {
    fontSize: 9,
    color: '#6B7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  clientInfo: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  table: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E40AF',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 9,
  },
  colItem: { flex: 3 },
  colUnit: { width: 40, textAlign: 'center' as const },
  colQty: { width: 40, textAlign: 'center' as const },
  colPrice: { width: 70, textAlign: 'right' as const },
  colTotal: { width: 70, textAlign: 'right' as const },
  colService: { flex: 3 },
  colServiceQty: { width: 40, textAlign: 'center' as const },
  colServiceUnit: { width: 70, textAlign: 'right' as const },
  colServicePrice: { width: 70, textAlign: 'right' as const },
  totalsSection: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    width: 200,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    width: 80,
    textAlign: 'right' as const,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: '#1E40AF',
    width: 200,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    flex: 1,
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1E40AF',
    width: 80,
    textAlign: 'right' as const,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  infoText: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 3,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center' as const,
    marginBottom: 3,
  },
  pageNumber: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
});

interface QuotePDFProps {
  quote: Quote;
  company: Company;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function QuotePDF({ quote, company }: QuotePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name || 'Sua Empresa'}</Text>
            {company.document && <Text style={styles.companyDetail}>{company.document}</Text>}
            {company.phone && <Text style={styles.companyDetail}>{company.phone}</Text>}
            {company.address && <Text style={styles.companyDetail}>{company.address}</Text>}
          </View>
          {company.logo && (
            <Image src={company.logo} style={styles.logo} />
          )}
        </View>

        {/* Quote Title */}
        <View style={styles.quoteTitle}>
          <Text style={styles.quoteNumber}>
            ORÇAMENTO #{String(quote.number).padStart(4, '0')}
            {quote.version > 1 && ` (v${quote.version})`}
          </Text>
          <Text style={styles.quoteDate}>
            {format(new Date(quote.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENTE</Text>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{quote.clientName || 'Não informado'}</Text>
            {quote.clientPhone && <Text style={styles.clientDetail}>Tel: {quote.clientPhone}</Text>}
            {quote.clientAddress && <Text style={styles.clientDetail}>Endereço: {quote.clientAddress}</Text>}
          </View>
        </View>

        {/* Materials */}
        {quote.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MATERIAIS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
                <Text style={[styles.tableHeaderText, styles.colUnit]}>Un.</Text>
                <Text style={[styles.tableHeaderText, styles.colQty]}>Qtd.</Text>
                <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit.</Text>
                <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
              </View>
              {quote.items.map((item, index) => (
                <View key={item.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, styles.colItem]}>{item.name}</Text>
                  <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice)}</Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services */}
        {quote.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SERVIÇOS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colService]}>Serviço</Text>
                <Text style={[styles.tableHeaderText, styles.colServiceQty]}>Qtd.</Text>
                <Text style={[styles.tableHeaderText, styles.colServiceUnit]}>Unit.</Text>
                <Text style={[styles.tableHeaderText, styles.colServicePrice]}>Total</Text>
              </View>
              {quote.services.map((service, index) => (
                <View key={service.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tableCell, styles.colService]}>{service.name}</Text>
                  <Text style={[styles.tableCell, styles.colServiceQty]}>{service.quantity || 1}</Text>
                  <Text style={[styles.tableCell, styles.colServiceUnit]}>{formatCurrency(service.unitPrice || service.price)}</Text>
                  <Text style={[styles.tableCell, styles.colServicePrice]}>{formatCurrency(service.price)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Totals */}
        <View style={styles.totalsSection}>
          {quote.subtotalMaterials > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Materiais:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.subtotalMaterials)}</Text>
            </View>
          )}
          {quote.subtotalServices > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Serviços:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.subtotalServices)}</Text>
            </View>
          )}
          {quote.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Desconto:</Text>
              <Text style={styles.totalValue}>-{formatCurrency(quote.discount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(quote.total)}</Text>
          </View>
        </View>

        {/* Payment & Validity */}
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Validade: </Text>
              {quote.validityDays} dias
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Condições de Pagamento: </Text>
              {quote.paymentConditions}
            </Text>
            {quote.clientNotes && (
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Observações: </Text>
                {quote.clientNotes}
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company.footerText}</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
}
