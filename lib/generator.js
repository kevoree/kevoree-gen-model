'use strict';

var path         = require('path'),
    chalk        = require('chalk'),
    genComponent = require('./genComponent'),
    genChannel   = require('./genChannel'),
    genGroup     = require('./genGroup'),
    genNode      = require('./genNode'),
    kevoree      = require('kevoree-library').org.kevoree,
    Entity       = require('kevoree-entities');

// constants
var PKG_PATTERN = /^[a-zA-Z0-9_]+([.][a-zA-Z0-9_]+)*$/;

// init Kevoree factory
var factory = new kevoree.factory.DefaultKevoreeFactory();

function createPackagesTree(packages, index, parent) {
    // create a new package using packages[index] name
    var p = factory.createPackage();
    p.name = packages[index];

    // check recursivity condition
    if (index === packages.length - 1) {
        // this is the last package in packages (eg. in 'org.kevoree.library.js' => this is 'js')
        parent.addPackages(p);
        // end recursion by sending the last package back
        return p;
    } else {
        // this is not the last package
        parent.addPackages(p);

        // recursion
        return createPackagesTree(packages, index+1, p);
    }
}

function getTypeDefinitionName(Class, filename) {
  if (Class.prototype.toString() === Entity.AbstractComponent.prototype.toString() ||
    Class.prototype.toString() === Entity.AbstractNode.prototype.toString() ||
    Class.prototype.toString() === Entity.AbstractGroup.prototype.toString() ||
    Class.prototype.toString() === Entity.AbstractChannel.prototype.toString()) {
      if (Class.name === 'PseudoClass') {
        var base = path.basename(filename);
        var ext = path.extname(base);
        return base.substr(0, base.length - ext.length);
      } else {
        return Class.name;
      }
    } else {
      return Class.prototype.toString();
    }
}

/**
 *
 * @param {String} dirPath
 * @param {Boolean} quiet
 * @param {Function} callback
 */
var generator = function generator(dirPath, quiet, callback) {
    if (dirPath === undefined) {
      throw new Error('dirPath undefined');
    }

    // get module package.json
    var pkgJson = require(path.resolve(dirPath, 'package.json')),
        file    = path.resolve(dirPath, pkgJson.main);

    // create a new ContainerRoot
    var model = factory.createContainerRoot();
    factory.root(model);

    // create packages according to "kevoree.namespace" specified in package.json
    if (pkgJson.kevoree && typeof (pkgJson.kevoree.namespace) === 'string') {
        if (PKG_PATTERN.test(pkgJson.kevoree.namespace)) {
            var pkgs = pkgJson.kevoree.namespace.split('.');

            // create packages tree and return the leaf (eg. 'org.kevoree.library.js' => leaf is 'js')
            // so that we can then add the TypeDefinition and DeployUnit to it
            var modelPkg = createPackagesTree(pkgs, 0, model);

            // create the project deployUnit
            var deployUnit = factory.createDeployUnit();
            deployUnit.name = pkgJson.name;
            deployUnit.version = pkgJson.version;
            var type = factory.createValue();
            type.name = 'platform';
            type.value = 'javascript';
            deployUnit.addFilters(type);
            modelPkg.addDeployUnits(deployUnit);

            // process main file
            var Class = require(file);
            var tdef;

            if (Object.getPrototypeOf(Class.prototype).toString() === Entity.AbstractComponent.prototype.toString()) {
              tdef = genComponent(deployUnit, Class);
            } else if (Object.getPrototypeOf(Class.prototype).toString() === Entity.AbstractChannel.prototype.toString()) {
              tdef = genChannel(deployUnit, Class);
            } else if (Object.getPrototypeOf(Class.prototype).toString() === Entity.AbstractGroup.prototype.toString()) {
              tdef = genGroup(deployUnit, Class);
            } else if (Object.getPrototypeOf(Class.prototype).toString() === Entity.AbstractNode.prototype.toString()) {
              tdef = genNode(deployUnit, Class);
            } else {
              if (!quiet) {
                  process.stdout.write(chalk.yellow('Ignored:')+'\n\tFile: '+file+'\n\tReason: Not a KevoreeEntity (check that you have only one version of kevoree-entities in your dependency tree)');
                  callback(new Error('This is not the class you are looking for'));
              }
            }

            // add KevoreeJS deployUnit to the TypeDefinition
            tdef.name = getTypeDefinitionName(Class, pkgJson.main);
            if (Class.prototype.tdef_version) {
              tdef.version = Class.prototype.tdef_version;
              tdef.addDeployUnits(deployUnit);

              if (pkgJson.description) {
                var desc = factory.createValue();
                desc.name = 'description';
                desc.value = pkgJson.description;
                tdef.addMetaData(desc);
              }

              // add TypeDefinition to the specified kevoree package
              modelPkg.addTypeDefinitions(tdef);

              callback(null, model, pkgJson.kevoree.namespace, modelPkg.typeDefinitions.get(0), deployUnit);
            } else {
              callback(new Error('The TypeDefinition must specify a version with a named static property: "tdef_version"'));
            }
        } else {
            callback(new Error('The given namespace "'+pkgJson.kevoree.namespace+'" in package.json is not valid (expected: '+PKG_PATTERN.toString()+')'));
        }
    } else {
        callback(new Error('Unable to find "kevoree.namespace" property in "'+pkgJson.name+'" package.json'));
    }
};

module.exports = generator;
