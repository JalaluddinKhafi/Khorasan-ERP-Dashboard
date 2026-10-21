# Third-party assets

The frontend vendors the same Bootstrap, jQuery, DataTables and Font Awesome versions already referenced by the template. No visual framework version was upgraded.

| Asset | Version | Source | License |
| --- | --- | --- | --- |
| Bootstrap RTL and bundle | 5.3.0-alpha1 | https://github.com/twbs/bootstrap/tree/v5.3.0-alpha1 | MIT |
| jQuery | 3.6.0 | https://jquery.com/ | MIT |
| DataTables and Bootstrap integration | 1.13.4 | https://datatables.net/ | MIT |
| Persian DataTables language | 1.13.4 | https://github.com/DataTables/Plugins/tree/1.13.4/i18n | MIT |
| Font Awesome Free | 6.0.0-beta3 | https://fontawesome.com/license/free | Fonts: SIL OFL 1.1; CSS/code: MIT; icons: CC BY 4.0 |
| Inter | Google Fonts CSS downloaded 2026-10-28 | https://fonts.google.com/specimen/Inter | SIL OFL 1.1 |
| SheetJS Community Edition | 0.18.5 | https://github.com/SheetJS/sheetjs/tree/v0.18.5 | Apache 2.0 |
| html2pdf.js bundle | 0.10.1 | https://github.com/eKoopmans/html2pdf.js/tree/v0.10.1 | MIT; includes html2canvas and jsPDF |

Copyright headers are retained in distributed assets. License texts are in `licenses/`. The old customer-balance page's unreachable SheetJS CDN reference was replaced with the locally available CE version used by the completed exports.

Placeholder SVGs in `assets/images/placeholders/` recreate the dimensions, colors and labels of the template's unavailable placeholder image URLs. They contain no remote image content.
