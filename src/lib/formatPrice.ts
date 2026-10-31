const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const formatPrice = (amountCents: number) => fmt.format(amountCents / 100)
