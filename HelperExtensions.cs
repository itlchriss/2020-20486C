using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using System.Web.Mvc;

namespace WebAPI.Controllers.Helpers
{
    public static class HelperExtensions
    {
        public static IHtmlString BootstrapJumbotron(this HtmlHelper htmlhelper, string text)
        {
            var tagBuilder = new TagBuilder("div");
            tagBuilder.AddCssClass("jumbotron");
            tagBuilder.InnerHtml = text;
            return MvcHtmlString.Create(tagBuilder.ToString());
        }

        public static IHtmlString BootstrapCol4Data<TModel, TProperty>(
            this HtmlHelper<TModel> htmlHelper, Expression<Func<TModel, TProperty>> expression)
        {
            var expr = ExpressionHelper.GetExpressionText(expression);
            var data = ModelMetadata.FromLambdaExpression(expression, htmlHelper.ViewData);
            var tagBuilder = new TagBuilder("div");
            tagBuilder.AddCssClass("col-md-4 col-lg-2 col-xs-6");
            tagBuilder.InnerHtml = data.Model as string;
            return MvcHtmlString.Create(tagBuilder.ToString());
        }
    }
}