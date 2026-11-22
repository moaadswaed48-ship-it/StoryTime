import type { ReactNode } from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from 'react-email'
import { dirOf, type Lang } from '@/i18n/config'

/**
 * The one frame every StoryTime email uses: neutral colours (the brand is not decided yet), one column, 16 px text,
 * one dark button, no images and no tracking pixel. Right-to-left for Arabic and Hebrew: `dir` and the text
 * alignment are set on every block, because several email apps drop the attribute on <html>.
 */
const INK = '#1f1f1f'
const MUTED = '#5a5a5a'
const LINE = '#dedede'
const FONT = "-apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Hebrew', Arial, sans-serif"

export type Row = { label: string; value: string; placeholder?: boolean }

export function EmailLayout(props: {
  lang: Lang
  preview: string
  heading: string
  greeting: string
  body: ReactNode[]
  rows?: Row[]
  cta?: { label: string; href: string }
  linkFallback?: string
  after?: string[]
  signoff: string
  team: string
  footer: string[]
  unsubscribe?: { label: string; href: string }
  placeholderTag: string
}) {
  const dir = dirOf(props.lang)
  const align = dir === 'rtl' ? 'right' : 'left'
  const text = { color: INK, fontSize: '16px', lineHeight: '1.6', margin: '0 0 14px', textAlign: align } as const
  const small = { color: MUTED, fontSize: '13px', lineHeight: '1.55', margin: '0 0 8px', textAlign: align } as const
  return (
    <Html lang={props.lang} dir={dir}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Body style={{ backgroundColor: '#f4f4f2', fontFamily: FONT, margin: 0, padding: '20px 10px' }}>
        <Preview>{props.preview}</Preview>
        <Container dir={dir} style={{ backgroundColor: '#ffffff', border: `1px solid ${LINE}`, borderRadius: '12px', maxWidth: '560px', padding: '28px 24px' }}>
          <Text dir={dir} style={{ ...small, fontWeight: 600, letterSpacing: dir === 'rtl' ? 'normal' : '0.02em', margin: '0 0 20px' }}>StoryTime</Text>
          <Heading as="h1" dir={dir} style={{ color: INK, fontSize: '22px', lineHeight: '1.35', margin: '0 0 18px', textAlign: align }}>{props.heading}</Heading>
          <Text dir={dir} style={text}>{props.greeting}</Text>
          {props.body.map((b, i) => (typeof b === 'string' ? <Text key={i} dir={dir} style={{ ...text, whiteSpace: 'pre-line' }}>{b}</Text> : <Section key={i} dir={dir}>{b}</Section>))}
          {props.rows && props.rows.length > 0 && (
            <Section dir={dir} style={{ border: `1px solid ${LINE}`, borderRadius: '8px', margin: '4px 0 18px', padding: '6px 14px' }}>
              {props.rows.map((r, i) => (
                <div key={i} style={{ borderBottom: i < props.rows!.length - 1 ? `1px solid ${LINE}` : 'none', padding: '8px 0' }}>
                  <Text dir={dir} style={{ ...small, margin: 0 }}>{r.label}</Text>
                  <Text dir={dir} style={{ ...text, margin: 0, fontWeight: 600 }}>
                    {r.placeholder && <span style={{ border: `1px dashed ${MUTED}`, borderRadius: '999px', color: MUTED, fontSize: '12px', fontWeight: 500, marginInlineEnd: '6px', padding: '1px 8px' }}>{props.placeholderTag}</span>}
                    {r.value}
                  </Text>
                </div>
              ))}
            </Section>
          )}
          {props.cta && (
            <Section dir={dir} style={{ margin: '8px 0 20px', textAlign: align }}>
              <Button href={props.cta.href} style={{ backgroundColor: INK, borderRadius: '10px', boxSizing: 'border-box', color: '#ffffff', display: 'inline-block', fontSize: '16px', fontWeight: 600, padding: '14px 22px', textDecoration: 'none' }}>
                {props.cta.label}
              </Button>
              {props.linkFallback && (
                <>
                  <Text dir={dir} style={{ ...small, margin: '14px 0 4px' }}>{props.linkFallback}</Text>
                  <Text dir="ltr" style={{ ...small, textAlign: 'left', wordBreak: 'break-all' }}>
                    <Link href={props.cta.href} style={{ color: MUTED }}>{props.cta.href}</Link>
                  </Text>
                </>
              )}
            </Section>
          )}
          {props.after?.map((a, i) => <Text key={i} dir={dir} style={{ ...text, fontSize: '15px' }}>{a}</Text>)}
          <Text dir={dir} style={{ ...text, margin: '20px 0 0' }}>{props.signoff}</Text>
          <Text dir={dir} style={text}>{props.team}</Text>
          <Hr style={{ borderColor: LINE, borderStyle: 'solid', borderWidth: '1px 0 0', margin: '20px 0' }} />
          {props.footer.map((f, i) => <Text key={i} dir={dir} style={small}>{f}</Text>)}
          {props.unsubscribe && (
            <Text dir={dir} style={small}>
              <Link href={props.unsubscribe.href} style={{ color: INK, textDecoration: 'underline' }}>{props.unsubscribe.label}</Link>
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}
