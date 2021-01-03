using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebAPI.Controllers.CustomModelBinders;
using WebAPI.Models;
using WebAPI.Models.DataModel;
using WebAPI.Models.ViewModel;

namespace WebAPI.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.Title = "Home Page";
            Foo foo = new Foo { 
                data = "abc",
                listData = new List<string>
                {
                    "xxx",
                    "yyy",
                    "zzz"
                }
            };
            //var listOfFoo = new List<Foo> {
            //    new Foo { data = "abc" },
            //    new Foo {data = "def"},
            //    new Foo {data = "xxyyy"}
            //};
            return View(foo);
        }

        public ActionResult Create()
        {
            return View();
        }

        [HttpPost]
        //public ActionResult DoCreate([ModelBinder(typeof(BindingFooFromAction))]Foo foo)
        public ActionResult DoCreate(PersonalInfo foo)
        {
            return RedirectToAction("Index");
        }

        public ActionResult DoSubmit(VwShoppingCart vwShoppingCart)
        {
            return View();
        }
    }
}
