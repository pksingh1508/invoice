import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image,
  Font
} from '@react-pdf/renderer';
import { InvoiceTemplateData, InvoiceTemplateConfig } from '@/types/templates';

// Register fonts for better PDF rendering
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: '/fonts/Helvetica.ttf' },
    { src: '/fonts/Helvetica-Bold.ttf', fontWeight: 'bold' }
  ]
});

interface ClassicTemplateProps {
  data: InvoiceTemplateData;
  config: InvoiceTemplateConfig;
}

export default function ClassicTemplate({ data, config }: ClassicTemplateProps) {
  const styles = createStyles(config);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.business.logo_url && (
              <Image 
                src={data.business.logo_url} 
                style={styles.logo}
              />
            )}
            <Text style={styles.businessName}>
              {data.business.name}
            </Text>
            {config.styles.header.show_business_info && (
              <View style={styles.businessInfo}>
                <Text style={styles.businessText}>{data.business.email}</Text>
                {data.business.phone && (
                  <Text style={styles.businessText}>{data.business.phone}</Text>
                )}
                {data.business.address && (
                  <Text style={styles.businessText}>{data.business.address}</Text>
                )}
              </View>
            )}
          </View>
          
          {config.styles.header.show_invoice_details && (
            <View style={styles.headerRight}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <View style={styles.invoiceDetails}>
                <Text style={styles.invoiceNumber}>
                  Invoice #: {data.invoice.number}
                </Text>
                <Text style={styles.invoiceDate}>
                  Date: {data.invoice.issued_date}
                </Text>
                {data.invoice.due_date && (
                  <Text style={styles.invoiceDate}>
                    Due Date: {data.invoice.due_date}
                  </Text>
                )}
                <Text style={[styles.status, getStatusStyle(data.invoice.status, config)]}>
                  {data.invoice.status.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Client Details */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{data.client.name}</Text>
            {data.client.email && (
              <Text style={styles.clientText}>{data.client.email}</Text>
            )}
            {data.client.address && (
              <Text style={styles.clientText}>{data.client.address}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {config.styles.table.show_item_numbers && (
              <Text style={[styles.tableHeaderText, { width: '10%' }]}>#</Text>
            )}
            <Text style={[styles.tableHeaderText, { width: '40%' }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { width: '15%' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { width: '20%' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, { width: '15%' }]}>Total</Text>
          </View>

          {/* Table Rows */}
          {data.items.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow,
                index % 2 === 1 && config.styles.table.row_alternate_background
                  ? { backgroundColor: config.styles.table.row_alternate_background }
                  : {}
              ]}
            >
              {config.styles.table.show_item_numbers && (
                <Text style={[styles.tableCellText, { width: '10%' }]}>
                  {index + 1}
                </Text>
              )}
              <Text style={[styles.tableCellText, { width: '40%' }]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCellText, { width: '15%' }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCellText, { width: '20%' }]}>
                {formatCurrency(item.unit_price, data.invoice.currency)}
              </Text>
              <Text style={[styles.tableCellText, { width: '15%' }]}>
                {formatCurrency(item.total, data.invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsSection}>
            {config.styles.totals.show_subtotals && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(data.totals.subtotal, data.invoice.currency)}
                </Text>
              </View>
            )}
            
            {data.totals.vat_rate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  VAT ({data.totals.vat_rate}%):
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(data.totals.vat_amount, data.invoice.currency)}
                </Text>
              </View>
            )}
            
            <View style={[styles.totalRow, styles.finalTotalRow]}>
              <Text style={styles.finalTotalLabel}>Total:</Text>
              <Text style={styles.finalTotalValue}>
                {formatCurrency(data.totals.total, data.invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        {(config.styles.footer.show_terms || 
          config.styles.footer.show_payment_instructions || 
          config.styles.footer.show_notes) && (
          <View style={styles.footer}>
            {config.styles.footer.show_terms && data.terms && (
              <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Terms:</Text>
                <Text style={styles.footerText}>{data.terms}</Text>
              </View>
            )}
            
            {config.styles.footer.show_payment_instructions && data.payment_instructions && (
              <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Payment Instructions:</Text>
                <Text style={styles.footerText}>{data.payment_instructions}</Text>
              </View>
            )}
            
            {config.styles.footer.show_notes && data.invoice.notes && (
              <View style={styles.footerSection}>
                <Text style={styles.footerTitle}>Notes:</Text>
                <Text style={styles.footerText}>{data.invoice.notes}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

// Helper function to create styles based on template config
function createStyles(config: InvoiceTemplateConfig) {
  const { colors, fonts, layout, styles: templateStyles } = config;
  
  return StyleSheet.create({
    page: {
      fontFamily: fonts.primary,
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
      backgroundColor: colors.background,
      padding: layout.margins.top,
      paddingLeft: layout.margins.left,
      paddingRight: layout.margins.right,
      paddingBottom: layout.margins.bottom,
    },
    
    // Header Styles
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 30,
      paddingBottom: templateStyles.header.border_bottom ? 20 : 0,
      borderBottomWidth: templateStyles.header.border_bottom ? 1 : 0,
      borderBottomColor: colors.border,
      backgroundColor: templateStyles.header.background_color || 'transparent',
    },
    
    headerLeft: {
      flex: 1,
    },
    
    headerRight: {
      alignItems: 'flex-end',
    },
    
    logo: {
      width: templateStyles.header.logo_size === 'large' ? 80 : 
             templateStyles.header.logo_size === 'medium' ? 60 : 40,
      height: templateStyles.header.logo_size === 'large' ? 60 : 
              templateStyles.header.logo_size === 'medium' ? 45 : 30,
      marginBottom: 10,
    },
    
    businessName: {
      fontSize: fonts.sizes.title,
      fontWeight: 'bold',
      color: colors.text_primary,
      marginBottom: 10,
    },
    
    businessInfo: {
      marginTop: 5,
    },
    
    businessText: {
      fontSize: fonts.sizes.small,
      color: colors.text_secondary,
      marginBottom: 2,
    },
    
    invoiceTitle: {
      fontSize: fonts.sizes.heading,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 10,
    },
    
    invoiceDetails: {
      alignItems: 'flex-end',
    },
    
    invoiceNumber: {
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
      marginBottom: 5,
    },
    
    invoiceDate: {
      fontSize: fonts.sizes.body,
      color: colors.text_secondary,
      marginBottom: 5,
    },
    
    status: {
      fontSize: fonts.sizes.small,
      fontWeight: 'bold',
      marginTop: 5,
    },
    
    // Client Section
    clientSection: {
      marginBottom: 30,
    },
    
    sectionTitle: {
      fontSize: fonts.sizes.heading,
      fontWeight: 'bold',
      color: colors.text_primary,
      marginBottom: 10,
    },
    
    clientInfo: {
      marginLeft: 0,
    },
    
    clientName: {
      fontSize: fonts.sizes.body,
      fontWeight: 'bold',
      color: colors.text_primary,
      marginBottom: 3,
    },
    
    clientText: {
      fontSize: fonts.sizes.body,
      color: colors.text_secondary,
      marginBottom: 2,
    },
    
    // Table Styles
    table: {
      marginBottom: 30,
    },
    
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: templateStyles.table.header_background,
      padding: 10,
      borderBottomWidth: templateStyles.table.border_style !== 'none' ? 1 : 0,
      borderBottomColor: colors.border,
    },
    
    tableHeaderText: {
      fontSize: fonts.sizes.body,
      fontWeight: 'bold',
      color: templateStyles.table.header_text_color,
      textAlign: 'left',
    },
    
    tableRow: {
      flexDirection: 'row',
      padding: 10,
      borderBottomWidth: templateStyles.table.border_style !== 'none' ? 1 : 0,
      borderBottomColor: colors.border,
    },
    
    tableCellText: {
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
      textAlign: 'left',
    },
    
    // Totals Styles
    totalsContainer: {
      flexDirection: 'row',
      justifyContent: templateStyles.totals.alignment === 'right' ? 'flex-end' : 'flex-start',
      marginBottom: 30,
    },
    
    totalsSection: {
      width: 300,
      backgroundColor: templateStyles.totals.background_color || 'transparent',
      padding: templateStyles.totals.background_color ? 15 : 0,
    },
    
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    
    finalTotalRow: {
      borderTopWidth: templateStyles.totals.show_subtotals ? 1 : 0,
      borderTopColor: colors.border,
      paddingTop: templateStyles.totals.show_subtotals ? 10 : 0,
      marginTop: templateStyles.totals.show_subtotals ? 5 : 0,
    },
    
    totalLabel: {
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
    },
    
    totalValue: {
      fontSize: fonts.sizes.body,
      color: colors.text_primary,
    },
    
    finalTotalLabel: {
      fontSize: templateStyles.totals.highlight_total ? fonts.sizes.heading : fonts.sizes.body,
      fontWeight: templateStyles.totals.highlight_total ? 'bold' : 'normal',
      color: templateStyles.totals.highlight_total ? colors.primary : colors.text_primary,
    },
    
    finalTotalValue: {
      fontSize: templateStyles.totals.highlight_total ? fonts.sizes.heading : fonts.sizes.body,
      fontWeight: templateStyles.totals.highlight_total ? 'bold' : 'normal',
      color: templateStyles.totals.highlight_total ? colors.primary : colors.text_primary,
    },
    
    // Footer Styles
    footer: {
      marginTop: 'auto',
      paddingTop: templateStyles.footer.border_top ? 20 : 0,
      borderTopWidth: templateStyles.footer.border_top ? 1 : 0,
      borderTopColor: colors.border,
      backgroundColor: templateStyles.footer.background_color || 'transparent',
    },
    
    footerSection: {
      marginBottom: 10,
    },
    
    footerTitle: {
      fontSize: fonts.sizes.small,
      fontWeight: 'bold',
      color: colors.text_primary,
      marginBottom: 3,
    },
    
    footerText: {
      fontSize: fonts.sizes.small,
      color: colors.text_secondary,
      lineHeight: 1.4,
    },
  });
}

// Helper function to get status color
function getStatusStyle(status: string, config: InvoiceTemplateConfig) {
  const colors = {
    'paid': '#059669',
    'sent': '#2563EB',
    'overdue': '#DC2626',
    'cancelled': '#6B7280',
    'draft': config.colors.text_secondary
  };
  
  return {
    color: colors[status as keyof typeof colors] || config.colors.text_secondary
  };
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
}