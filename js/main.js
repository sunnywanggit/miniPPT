//检测是否是主页面
const isMain = str => (/^#{1,2}(?!#)/).test(str);
//检测是否是子页面
const isSub = str => (/^#{3}(?!#)/).test(str);
//$表示其是一个单独的dom对象
const $ = s => document.querySelector(s)
// $$ 是一个list对象
const $$ = s => document.querySelectorAll(s)
//将markdown语法转换成html语法
const convertRaw = (raw) => {
    let html = ``
    //使用正则表达式将每一个单独的页面放入数组
    let arr = raw.split(/\n(?=\s*#{1,3}[^#])/).filter(s => s != '').map(s => s.trim())
    for (let i = 0; i < arr.length; i++) {
        if (arr[i + 1] !== undefined) {
            if (isMain(arr[i]) && isMain(arr[i + 1])) {
                html += `
                    <section data-markdown>
                        <textarea data-template>
                            ${arr[i]}
                        </textarea>
                    </section>
                `
            } else if (isMain(arr[i]) && isSub(arr[i + 1])) {
                html += `
                    <section>
                    <section data-markdown>
                        <textarea data-template>
                            ${arr[i]}
                        </textarea>
                    </section>
                `
            } else if (isSub([arr[i]]) && isSub([arr[i + 1]])) {
                html += `
                    <section data-markdown>
                        <textarea data-template>
                            ${arr[i]}
                        </textarea>
                    </section>
                `
            } else if (isSub([arr[i]]) && isMain(arr[i + 1])) {
                html += `
                    <section data-markdown>
                        <textarea data-template>
                            ${arr[i]}
                        </textarea>
                    </section>
                    </section>
                `
            }
        } else {
            if (isMain(arr[i])) {
                html += `
                    <section data-markdown>
                        <textarea data-template>
                            ${arr[i]}
                        </textarea>
                    </section>
                `
            } else if (isSub(arr[i])) {
                html += `
                    <section data-markdown>
                        <textarea data-template>
                            ${arr[i]}
                        </textarea>
                    </section>
                    </section>
                `
            }
        }
    }
    return html
}


const Menu = {
    init() {
        this.$settingsIcon = $('.settings')
        this.$menu = $('.menu')
        this.$close = $('.menu .close')
        this.$$tabs = $$('.menu .tab')
        this.$$content = $$('.menu .content')
        this.$detail = $('.detail')

        this.bind()
    },

    bind() {
        this.$settingsIcon.onclick = () => {
            this.$menu.classList.add('open')
        }

        this.$close.onclick = () => {
            this.$menu.classList.remove('open')
        }

        for (let i = 0; i < this.$$tabs.length; i++) {
            this.$$tabs[i].onclick = () => {
                [...this.$detail.children].forEach(child => {
                    child.classList.remove('active')
                })
                this.$$tabs[i].classList.add('active')
                this.$$content[i].classList.add('active')
            }

        }

    }

}

const Edit = {
    init() {
        this.$inputContent = $('.edit .text')
        this.$submitEdit = $('.edit .submitEdit')
        this.$slidesContainer = $('.slides')
        this.markdown = localStorage.markdown || `# 欢饮使用onSlide`

        this.bind()
        this.start()
    },

    bind() {

        this.$submitEdit.onclick = () => {
            localStorage.markdown = this.$inputContent.value
            location.reload()
        }

    },
    start() {
        this.$inputContent.value = this.markdown
        this.$slidesContainer.innerHTML = convertRaw(this.markdown)
        // More info https://github.com/hakimel/reveal.js#configuration
        Reveal.initialize({
            controls: true,
            progress: true,
            center: localStorage.position === 'left' ? false : true,
            hash: true,

            transition: localStorage.effect || 'slide', // none/fade/slide/convex/concave/zoom

            // More info https://github.com/hakimel/reveal.js#dependencies
            dependencies: [
                {
                    src: 'plugin/markdown/marked.js', condition: function () {
                        return !!document.querySelector('[data-markdown]');
                    }
                },
                {
                    src: 'plugin/markdown/markdown.js', condition: function () {
                        return !!document.querySelector('[data-markdown]');
                    }
                },
                {src: 'plugin/highlight/highlight.js'},
                {src: 'plugin/search/search.js', async: true},
                {src: 'plugin/zoom-js/zoom.js', async: true},
                {src: 'plugin/notes/notes.js', async: true}
            ]
        });
    }


}

const Uploader = {
    init() {
        this.$fileInput = $('#img-uploader')
        this.$textarea = $('.content textarea')

        AV.init({
            appId: "AgF96i0e5JJ06yEJaglcXmyt-gzGzoHsz",
            appKey: "OeuNHj6hJU3eWeW8GoHbv2tX",
            serverURLs: "https://agf96i0e.lc-cn-n1-shared.com"
        });

        this.bind()

    },
    bind() {
        let self = this
        this.$fileInput.onchange = function () {
            if (this.files.length > 0) {
                let localFile = this.files[0]
                console.log(localFile)
                if (localFile.size / 1048576 > 2) {
                    alert('文件不能超过2M')
                    return
                }
                self.insertText(`![上传中，进度0%]()`)
                let avFile = new AV.File(encodeURI(localFile.name), localFile)
                avFile.save({
                    keepFileName: true,
                    onprogress(progress) {
                        self.insertText(`![上传中，进度${progress.percent}%]()`)
                    }
                }).then(file => {
                    console.log('文件保存完成')
                    console.log(file)
                    let text = `![${file.attributes.name}](${file.attributes.url}?imageView2/0/w/800/h/400)`
                    self.insertText(text)
                }).catch(err => console.log(err))
            }
        }
    },
    insertText(text = '') {
        let $textarea = this.$textarea
        let start = $textarea.selectionStart
        let end = $textarea.selectionEnd
        let oldText = $textarea.value

        $textarea.value = `${oldText.substring(0, start)}${text} ${oldText.substring(end)}`
        $textarea.focus()
        $textarea.setSelectionRange(start, start + text.length)
    }
}

const Theme = {
    init() {

        this.$$figures = $$('.themes figure')
        this.$effects = $('.detail .effect')
        this.$position = $('.detail .position')
        this.$reveal = $('.reveal')

        this.bind()
        this.loadTheme()
    },

    bind() {
        [...this.$$figures].forEach(figure => {
            figure.onclick = () => {
                localStorage.theme = figure.dataset.theme
                location.reload()
            }
        })

        this.$effects.onchange = function () {
            localStorage.effect = this.value
            location.reload()
        }

        this.$position.onchange = function () {
            localStorage.position = this.value
            location.reload()
        }
    },
    loadTheme() {
        let theme = localStorage.theme || 'monokai'
        let link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = `css/theme/${theme}.css`;
        document.head.appendChild(link);

        [...this.$$figures].find(figure => figure.dataset.theme === theme).classList.add('select')
        this.$effects.value = localStorage.effect
        this.$position.value = localStorage.position || 'center'
        this.$reveal.classList.add(this.$position.value)
    },
}

const Print = {
    init() {

        this.$download = $('.download')

        this.bind()
        this.start()
    },
    bind() {
        this.$download.onclick = () => {
            console.log('click');
            //打开一个新的页面进行文件下载
            let $link = document.createElement('a')
            $link.setAttribute('target', '_blank')
            $link.setAttribute('href', location.href.replace(/#\/.*/, '?print-pdf'))
            $link.click()
        }
    },
    start() {
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        if (window.location.search.match(/print-pdf/gi)) {
            link.href = 'css/print/pdf.css';
            console.log('print');
            window.print()
        } else {
            link.href = 'css/print/paper.css';
        }
        document.head.appendChild(link);
    }
}


const App = {
    init() {
        [...arguments].forEach(Module => Module.init())
    }
}

App.init(Menu,Uploader,  Edit,Theme, Print, Uploader)





