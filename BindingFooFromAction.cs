using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebAPI.Models;

namespace WebAPI.Controllers.CustomModelBinders
{
    public class BindingFooFromAction : IModelBinder
    {
        public object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
        {
            var request = controllerContext.HttpContext.Request;
            var value = request.Form.Get("Value");
            var data = request.Form.Get("Data");

            if (value != null)
            {
                return new Foo { data = Convert.ToString(value) };
            }
            else
            {
                return new Foo { data = Convert.ToString(data) };
            }
        }
    }
}