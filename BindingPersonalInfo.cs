using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebAPI.Models.DataModel;

namespace WebAPI.Controllers.CustomModelBinders
{
    public class BindingPersonalInfo : IModelBinder
    {
        public object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
        {
            var request = controllerContext.HttpContext.Request;
            var addr1 = request.Form.Get("AddressLine1");
            var addr2 = request.Form.Get("AddressLine2");
            var addr3 = request.Form.Get("AddressLine3");
            var addr = (addr1 + " " + addr2 + " " + addr3).Trim();

            var lastName = request.Form.Get("LastName");
            var firstName = request.Form.Get("FirstName");
            return new PersonalInfo
            {
                lastName = lastName,
                firstName = firstName,
                address = addr
            };
        }
    }
}