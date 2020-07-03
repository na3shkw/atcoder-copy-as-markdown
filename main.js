const template = {
    button: `
        <span
            class="btn btn-default btn-sm btn-copy-as-markdown"
            tabindex="0"
            data-toggle="tooltip"
            data-trigger="manual"
            data-original-title="Copied!"
            data-header-name="{{ headerName }}"
        >Copy as Markdown</span>`,
    tooltip: `
        <div
            class="tooltip fade top in"
            role="tooltip"
            style="top: {{ top }}px; left: {{ left }}px;"
        >
            <div class="tooltip-arrow" style="left: 50%;"></div>
            <div class="tooltip-inner">Copied!</div>
        </div>`,
};
let sourceHTML;

/**
 * 要素を取得
 * @param {string} selector 
 */
function elem(selector) {
    return document.querySelectorAll(selector);
}

/**
 * フォーマット文字列に値を代入して返す
 */
function sprintf(format, args) {
    let formatted = format;
    let reg;
    for (idx in args) {
        reg = new RegExp("{{\\s*" + idx + "\\s*}}", "g");
        formatted = formatted.replace(reg, args[idx]);
    }
    return formatted;
}

/**
 * メイン関数
 */
function main() {
    // 問題文でない場合はなにもしない
    if (window.location.href.indexOf("tasks/") == -1)
        return;
    GM_xmlhttpRequest({
        method: "GET",
        url: window.location.href,
        onload: function (res) {
            sourceHTML = res.responseText.replace(/\r?\n/g, "");
        }
    })
    for (const h3 of elem("h3")) {
        if (["問題文", "制約", "入力", "出力"].indexOf(h3.textContent) > -1) {
            h3.insertAdjacentHTML(
                "beforeend",
                sprintf(
                    template.button,
                    {
                        headerName: h3.textContent
                    }
                )
            );
        }
    }
    for (const button of elem(".btn-copy-as-markdown")) {
        button.addEventListener("click", function (event) {
            const button = event.target;
            window.getSelection().removeAllRanges();
            try {
                const pattern = new RegExp(
                    "<section>\s*<h3>\s*" + button.getAttribute("data-header-name") + ".+</section>",
                    "g"
                );
                let copyText = sourceHTML.match(pattern)[0].split("</section>")[0];
                copyText = copyText
                    .replace(/<\/var><var>/g, "$\n$")
                    .replace(/<\/?var>/g, "$")
                    .replace(/<li>/g, "* ")
                    .replace(/<\/li>|<\/p>/g, "\n")
                    .replace(/<h3>.+<\/h3>|<[^>]+>/g, "");
                const listener = function (e) {
                    e.clipboardData.setData("text/plain", copyText);
                    e.preventDefault();
                    document.removeEventListener("copy", listener);
                }
                document.addEventListener("copy", listener);
                document.execCommand("copy");
            } catch (err) {
                console.log(err);
            }
            window.getSelection().removeAllRanges();
        });
    }
}
