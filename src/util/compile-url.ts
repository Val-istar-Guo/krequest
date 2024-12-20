function compilePathnameTemplate(template: string, params: Record<string, string | number>): string {
  return template
    .replace(/(^|\/)(?::([^/]+)|{([^/]+)}|%7B([^/]+)%7D)(?=$|\/)/g, (_, prefix, group1, group2, group3) => {
      if (group1 && params[group1]) {
        return `${prefix}${params[group1]}`
      } else if (group2 && params[group2]) {
        return `${prefix}${params[group2]}`
      } else if (group3 && params[group3]) {
        return `${prefix}${params[group3]}`
      }

      return ''
    })
}


export function compileUrl(obj: string | URL, routeParams: Record<string, string | number>): URL {
  const url = new URL(typeof obj === 'string' ? obj : obj.href)
  url.pathname = compilePathnameTemplate(url.pathname, routeParams)
  return url
}
