    type="number"
                step="0.1"
                value={easyCoeff}
                onChange={(e) => setEasyCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficult-coeff">Difficult (2)</Label>
              <Input
                id="difficult-coeff"
                type="number"
                step="0.1"
                value={difficultCoeff}
                onChange={(e) => setDifficultCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="very-difficult-coeff">Very Difficult (3)</Label>
              <Input
                id="very-difficult-coeff"
                type="number"
                step="0.1"
                value={veryDifficultCoeff}
                onChange={(e) => setVeryDifficultCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="high-volume-coeff">High Volume (4)</Label>
              <Input
                id="high-volume-coeff"
                type="number"
                step="0.1"
                value={highVolumeCoeff}
                onChange={(e) => setHighVolumeCoeff(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="porter-coeff">Porter Coefficient</Label>
              <Input
                id="porter-coeff"
                type="number"
                step="0.1"
                value={porterCoeff}
                onChange={(e) => setPorterCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metalled-coeff">Metalled Coefficient</Label>
              <Input
                id="metalled-coeff"
                type="number"
                step="0.1"
                value={metalledCoeff}
                onChange={(e) => setMetalledCoeff(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graveled-coeff">Graveled Coefficient</Label>
              <Input
                id="graveled-coeff"
                type="number"
                step="0.1"
                value={graveledCoeff}
                onChange={(e) => setGraveledCoeff(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Material Rate Analysis</CardTitle>
          <Button size="sm" onClick={addItem} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Material
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">S.No</TableHead>
                  <TableHead className="min-w-[150px]">Material Name</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[100px]">Rate (Excl)</TableHead>
                  <TableHead className="w-[80px]">VAT %</TableHead>
                  <TableHead className="w-[100px]">Porter</TableHead>
                  <TableHead className="w-[100px]">Metalled</TableHead>
                  <TableHead className="w-[100px]">Graveled</TableHead>
                  <TableHead className="w-[100px]">L/UL</TableHead>
                  <TableHead className="w-[100px]">Weight (KG)</TableHead>
                  <TableHead className="w-[100px] text-right">Total Rate</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      No materials added yet. Click "Add Material" to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Name"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Select
                          value={item.category}
                          onValueChange={(val) => updateItem(item.id, "category", val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.rateExclVat}
                          onChange={(e) => updateItem(item.id, "rateExclVat", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={item.vat}
                            onChange={(e) => updateItem(item.id, "vat", e.target.value)}
                            className="h-8 text-xs text-right"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.preventDefault();
                              const rate = parseFloat(item.rateExclVat) || 0;
                              updateItem(item.id, "vat", (rate * 0.13).toFixed(2));
                            }}
                            title="Calculate 13% VAT"
                          >
                            %
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.porterCost}
                          onChange={(e) => updateItem(item.id, "porterCost", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.metalledCost}
                          onChange={(e) => updateItem(item.id, "metalledCost", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.graveledCost}
                          onChange={(e) => updateItem(item.id, "graveledCost", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.loadUnload}
                          onChange={(e) => updateItem(item.id, "loadUnload", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="number"
                          value={item.unitWeight}
                          onChange={(e) => updateItem(item.id, "unitWeight", e.target.value)}
                          className="h-8 text-xs text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-primary">
                        {calculateTotal(item)}
                      </TableCell>
                      <TableCell className="p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
