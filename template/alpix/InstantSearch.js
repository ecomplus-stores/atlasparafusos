import SearchEngine from '@ecomplus/storefront-components/src/SearchEngine.vue'

export default {
  name: 'InstantSearch',

  components: {
    SearchEngine
  },

  props: {
    term: {
      type: String,
      default: ''
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    pageSize: {
      type: Number,
      default: 5
    },
    autoFixScore: {
      type: Number,
      default: 0.6
    },
    searchEngineProps: Object,
    productCardProps: {
      type: Object,
      default () {
        return { isSmall: true }
      }
    }
  },

  data () {
    return {
      localTerm: this.term,
      searchTriggerTimer: null,
      searchTerm: '',
      history: [],
      searchResults: [],
      totalSearchResults: 0,
      isSearching: false,
      hasSearched: false,
      isFocused: false
    }
  },

  computed: {
    isOpen () {
      if (!this.isFocused) return false
      if (!this.localTerm) return this.history.length > 0
      return this.localTerm.length > 1
    },

    searchAllHref () {
      return '/search?term=' + encodeURIComponent(this.localTerm)
    }
  },

  methods: {
    hide () {
      this.$emit('update:is-visible', false)
    },

    setSearchTerm (term) {
      const $form = this.$el.closest('form')
      if ($form) {
        const $inputs = $form.elements
        for (let i = 0; i < $inputs.length; i++) {
          if ($inputs[i].name === 'term') {
            $inputs[i].value = term
            break
          }
        }
        $form.submit()
      }
    },

    handleFetching ({ fetching }) {
      this.isSearching = true
      fetching.finally(() => {
        this.isSearching = false
      })
    },

    handleSearch ({ ecomSearch }) {
      this.totalSearchResults = ecomSearch.getTotalCount()
      this.searchResults = ecomSearch.getItems()
        .slice(0, this.pageSize)
        .map(({ name, slug }) => ({ name, slug }))
      this.history = ecomSearch.history
        .filter(term => term.length > 2 && this.localTerm.indexOf(term) === -1)
        .slice(0, 6)
      if (!this.hasSearched) {
        this.hasSearched = true
      }
    },

    _onInput (e) {
      this.isFocused = true
      this.localTerm = e.target.value
    },

    _onFocus () {
      this.isFocused = true
    },

    _onBlur () {
      clearTimeout(this._blurTimer)
      this._blurTimer = setTimeout(() => {
        this.isFocused = false
      }, 200)
    }
  },

  mounted () {
    const $input = document.getElementById('search-input')
    if ($input) {
      this._$input = $input
      this._$input.addEventListener('input', this._onInput)
      this._$input.addEventListener('focus', this._onFocus)
      this._$input.addEventListener('blur', this._onBlur)
      if (document.activeElement === $input) {
        this.isFocused = true
        this.localTerm = $input.value
      }
    }
  },

  beforeDestroy () {
    clearTimeout(this._blurTimer)
    if (this._$input) {
      this._$input.removeEventListener('input', this._onInput)
      this._$input.removeEventListener('focus', this._onFocus)
      this._$input.removeEventListener('blur', this._onBlur)
    }
  },

  watch: {
    term (val) {
      this.localTerm = val
    },

    localTerm: {
      handler (term) {
        const nextSearchTerm = term.length > 1 ? term : ''
        if (nextSearchTerm !== this.searchTerm) {
          clearTimeout(this.searchTriggerTimer)
          this.searchTriggerTimer = setTimeout(() => {
            this.searchTerm = nextSearchTerm
          }, 250)
        }
        this.$emit('update:term', term)
      },
      immediate: true
    }
  }
}