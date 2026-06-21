import re

with open('d:/BussinessWebsite/frontend/src/pages/ProductDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reduce line spacing
content = content.replace("lineHeight: 1.8,", "lineHeight: 1.5,")

# 2. Find the Tabs function
tabs_pattern = re.compile(r'(// ─── Tabs ───+[\s\S]+?)(?=\n// ─── Main Component ───+)', re.DOTALL)
match = tabs_pattern.search(content)
if not match:
    print("Tabs not found")
    exit(1)
    
tabs_content = match.group(1)

# Extract review states and submit handler
review_logic_pattern = re.compile(r'  const \[reviewForm, setReviewForm\] = useState\(\{ rating: 0, comment: \'\' \}\);\n  const \[isSubmitting, setIsSubmitting\] = useState\(false\);\n  const \[reviewMsg, setReviewMsg\] = useState\(\{ type: \'\', text: \'\' \}\);\n\n  const TABS = \[\'description\', \'specifications\', \'reviews\'\];\n\n  // ── handleSubmitReview logic unchanged ──\n  const handleSubmitReview = async \(\) => \{[\s\S]+?\};\n\n  // Rating distribution\n  const ratingDist = \[5, 4, 3, 2, 1\]\.map\(r => \(\{\n    star: r,\n    count: reviews\.filter\(rv => Math\.round\(rv\.rating\) === r\)\.length,\n  \}\)\);\n  const avgRating = reviews\.length \? \(reviews\.reduce\(\(s, r\) => s \+ r\.rating, 0\) / reviews\.length\)\.toFixed\(1\) : \(product\.ratings\?\.average \|\| 0\)\.toFixed\(1\);')

review_logic_match = review_logic_pattern.search(tabs_content)

if not review_logic_match:
    print("Review logic not found")
    exit(1)
    
review_logic_str = review_logic_match.group(0)

# Replace in Tabs
new_tabs_content = tabs_content.replace(review_logic_str, "  const TABS = ['description', 'specifications'];")

# Fix TABS render
new_tabs_content = new_tabs_content.replace("{t === 'reviews' ? `Reviews (${reviews.length})` : t.charAt(0).toUpperCase() + t.slice(1)}", "{t.charAt(0).toUpperCase() + t.slice(1)}")

# Extract review JSX
review_jsx_pattern = re.compile(r'          \{/\* ── Reviews ── \*/\}\n          \{tab === \'reviews\' && \(\n            <div>([\s\S]+?)            </div>\n          \)\}\n')
review_jsx_match = review_jsx_pattern.search(new_tabs_content)

if not review_jsx_match:
    print("Review JSX not found")
    exit(1)

review_jsx_str = review_jsx_match.group(1)

# Remove review JSX from Tabs
new_tabs_content = new_tabs_content.replace(review_jsx_match.group(0), "")

# Create ProductReviews component
# we need to remove the "const TABS = ..." from the review logic to put in the new component
clean_review_logic = review_logic_str.replace("  const TABS = ['description', 'specifications', 'reviews'];\n\n", "")

product_reviews_component = f"""
// ─── Product Reviews ─────────────────────────────────────────────────────────
function ProductReviews({{ product, reviews, onReviewSubmit }}) {{
{clean_review_logic}

  return (
    <div style={{{{ marginTop: 40, borderTop: '1px solid #2C2C26', paddingTop: 32 }}}}>
      <h3 style={{{{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: '#F5F0E8', marginBottom: 24 }}}}>Customer Reviews</h3>
{review_jsx_str}    </div>
  );
}}
"""

# Now replace the whole Tabs component in main content with ProductReviews + new Tabs
content = content.replace(tabs_content, product_reviews_component + "\n" + new_tabs_content)

# Now inject <ProductReviews /> right after Buy Now and Share block
# Find the end of the Share block
share_pattern = re.compile(r'(              \{/\* Share \*/\}\n              <div style=\{\{ display: \'flex\', gap: 12, marginTop: 12 \}\}>\n[\s\S]+?              </div>\n            </div>)')
content = re.sub(share_pattern, r'\1\n\n            {/* Reviews Section right after Buy Now */}\n            <ProductReviews product={product} reviews={reviews} onReviewSubmit={() => {}} />', content)

# Update the main Tabs render to not pass onReviewSubmit
content = content.replace("<Tabs product={product} reviews={reviews} onReviewSubmit={() => {}} />", "<Tabs product={product} />")

with open('d:/BussinessWebsite/frontend/src/pages/ProductDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Layout updated")
