using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebAPI.Models;
using WebAPI.Models.DataModel;

namespace WebAPI.Controllers.CustomModelBinders
{
    public class BindingModelFactory : IModelBinderProvider
    {
        public IModelBinder GetBinder(Type modelType)
        {
            if (modelType == typeof(Foo))
            {
                return new BindingFooFromAction();
            }
            else if (modelType == typeof(PersonalInfo))
            {
                return new BindingPersonalInfo();
            }
            else
                return null;
        }
    }
}